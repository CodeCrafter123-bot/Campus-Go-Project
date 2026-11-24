import { randomUUID } from "node:crypto";
import { getDb, getSetting, transaction } from "@/lib/db";
import { getBuilding, getProduct, getSlot, getStore } from "@/lib/catalog";
import { calcPrintPerCopy, getOrderTotals, validatePrintJob } from "@/lib/pricing";
import { checkSlot, isStoreOpen, slotLabel } from "@/lib/time";
import { addTransaction, round2 } from "@/lib/wallet";
import { validateRoom } from "@/lib/validation";
import { badRequest, conflict, notFound } from "@/lib/http";

/*
 * Orders.
 *
 * Placing an order: the app sends only WHAT it wants (product ids, sizes,
 * extras, quantities, print options). The server looks up the real prices,
 * checks every business rule, and saves the order + wallet payment together.
 *
 * Tracking: the status moves forward automatically with time
 * (Received → Preparing → On the way → Delivered), like a real kitchen,
 * even while the app is closed.
 */

export const ORDER_STATUSES = ["received", "preparing", "on_the_way", "delivered"];

// How long each status lasts before moving to the next one (simulation).
const STATUS_DURATION_MS = {
  received: 10_000,
  preparing: 8_000,
  on_the_way: 8_000,
};

const PRINT_STORE_ID = "printing";
const MAX_LINES = 30;
const MAX_PRODUCT_QUANTITY = 20;

/* ------------------------------------------------------------------ */
/* Reading orders                                                      */
/* ------------------------------------------------------------------ */

// Database row → the order shape the app already uses.
function toOrder(row) {
  const store = getStore(row.store_id);
  const slot = getSlot(row.slot_id);
  return {
    id: row.id,
    userId: row.user_id,
    storeId: row.store_id,
    storeName: store?.name ?? row.store_id,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    buildingId: row.building_id,
    buildingName: getBuilding(row.building_id)?.name ?? row.building_id,
    room: row.room,
    slotId: row.slot_id,
    slotLabel: slot ? slotLabel(slot) : row.slot_id,
    paymentMethod: row.payment_method,
    courier: row.courier,
    status: row.status,
    statusTimes: JSON.parse(row.status_times),
    createdAt: row.created_at,
    rating: row.rating_stars ? { stars: row.rating_stars, comment: row.rating_comment || "" } : null,
  };
}

/*
 * Moves an order forward if enough time has passed since its last status.
 * It can jump several steps (e.g. the app was closed for a minute).
 * Each step gets the time it "really" happened, not the time we noticed it.
 */
function advanceWithTime(row, now = Date.now()) {
  let status = row.status;
  const times = JSON.parse(row.status_times);
  let changed = false;

  while (STATUS_DURATION_MS[status]) {
    const startedAt = Date.parse(times[status]);
    const endsAt = startedAt + STATUS_DURATION_MS[status];
    if (endsAt > now) break;
    status = ORDER_STATUSES[ORDER_STATUSES.indexOf(status) + 1];
    times[status] = new Date(endsAt).toISOString();
    changed = true;
  }

  if (!changed) return row;
  const statusTimes = JSON.stringify(times);
  // "AND status = ?" → only update if nobody changed it meanwhile (e.g. a cancel).
  getDb()
    .prepare("UPDATE orders SET status = ?, status_times = ? WHERE id = ? AND status = ?")
    .run(status, statusTimes, row.id, row.status);
  return getDb().prepare("SELECT * FROM orders WHERE id = ?").get(row.id);
}

export function listOrders(userId) {
  return getDb()
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId)
    .map((row) => toOrder(advanceWithTime(row)));
}

// Admin: every order of every user (for the dashboard).
export function listAllOrders() {
  return getDb()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all()
    .map((row) => toOrder(advanceWithTime(row)));
}

// Returns the order only if it belongs to this user (otherwise "not found").
export function getOrderFor(userId, orderId) {
  const row = getDb().prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(orderId, userId);
  if (!row) throw notFound("Order not found.");
  return toOrder(advanceWithTime(row));
}

/* ------------------------------------------------------------------ */
/* Placing an order                                                    */
/* ------------------------------------------------------------------ */

// Checks one cart line and returns it with the price calculated by the server.
function buildLine(item, index, storeId) {
  const where = `Item ${index + 1}`;
  if (!item || typeof item !== "object") throw badRequest(`${where} is not valid.`);

  if (item.type === "print") {
    if (storeId !== PRINT_STORE_ID) throw badRequest("Print jobs can only be ordered from the Printing Office.");
    const copies = item.quantity;
    const error = validatePrintJob(item.printJob, copies);
    if (error) throw badRequest(`${where}: ${error}`);
    const job = {
      name: item.printJob.name.trim(),
      pages: item.printJob.pages,
      color: item.printJob.color,
      doubleSided: item.printJob.doubleSided,
      binding: item.printJob.binding,
    };
    return {
      type: "print",
      productId: "print-job",
      storeId,
      name: job.name,
      image: "🖨️",
      unitPrice: calcPrintPerCopy(job), // price of ONE copy; quantity = copies
      quantity: copies,
      size: null,
      extras: [],
      printJob: job,
    };
  }

  const product = getProduct(item.productId);
  if (!product || product.storeId !== storeId) throw badRequest(`${where}: this product is not available in this store.`);
  if (!product.inStock) throw badRequest(`${product.name} is out of stock.`);
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_PRODUCT_QUANTITY) {
    throw badRequest(`${product.name}: quantity must be between 1 and ${MAX_PRODUCT_QUANTITY}.`);
  }

  // Size and extras are matched by their label; their prices come from the database.
  const sizes = product.options?.sizes ?? [];
  const allExtras = product.options?.extras ?? [];
  let size = null;
  if (sizes.length > 0) {
    size = sizes.find((s) => s.label === item.size?.label);
    if (!size) throw badRequest(`${product.name}: please choose a valid size.`);
  }
  const wanted = Array.isArray(item.extras) ? item.extras.map((e) => e?.label) : [];
  if (new Set(wanted).size !== wanted.length) throw badRequest(`${product.name}: an extra was chosen twice.`);
  const extras = wanted.map((label) => {
    const extra = allExtras.find((e) => e.label === label);
    if (!extra) throw badRequest(`${product.name}: "${label}" is not a valid extra.`);
    return extra;
  });

  const unitPrice = round2(product.price + (size ? size.extra : 0) + extras.reduce((sum, e) => sum + e.price, 0));
  return {
    type: "product",
    productId: product.id,
    storeId,
    name: product.name,
    image: product.image,
    unitPrice,
    quantity: item.quantity,
    size,
    extras,
  };
}

/**
 * body = { items, buildingId, room, slotId, paymentMethod: "wallet" | "cash", expectedTotal? }
 * expectedTotal (optional) is the total the user saw in the app; if the real
 * total is different (e.g. a price changed), the order is refused so the user
 * is never charged an amount they did not see.
 */
export function placeOrder(userId, body) {
  const settings = getSetting("settings");
  const items = body.items;

  // 1. Cart: not empty, one store only.
  if (!Array.isArray(items) || items.length === 0) throw badRequest("Your cart is empty.");
  if (items.length > MAX_LINES) throw badRequest(`An order can have at most ${MAX_LINES} lines.`);
  const storeId = items[0]?.storeId;
  if (items.some((i) => i?.storeId !== storeId)) throw badRequest("All items must come from the same store.");
  const store = getStore(storeId);
  if (!store) throw badRequest("This store does not exist.");

  // 2. Store open now.
  const now = new Date();
  if (!isStoreOpen(store, now)) throw badRequest(`${store.name} is closed now.`);

  // 3. Every line checked and priced by the server.
  const lines = items.map((item, index) => buildLine(item, index, storeId));
  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  if (subtotal < settings.minimumOrder) throw badRequest(`Minimum order is $${settings.minimumOrder.toFixed(2)}.`);
  const totals = getOrderTotals(subtotal);

  // 4. Delivery place and time.
  const fields = {};
  if (!getBuilding(body.buildingId)) fields.buildingId = "Please choose a building.";
  const roomError = validateRoom(body.room);
  if (roomError) fields.room = roomError;
  const slot = getSlot(body.slotId);
  if (!slot) {
    fields.slot = "Please choose a delivery time.";
  } else {
    const check = checkSlot(slot, {
      prepMinutes: store.avgPrepMinutes,
      bufferMinutes: settings.deliveryBufferMinutes,
      store,
      date: now,
    });
    if (!check.available) fields.slot = `This delivery time is no longer available (${check.reason.toLowerCase()}).`;
  }
  if (!["wallet", "cash"].includes(body.paymentMethod)) fields.paymentMethod = "Please choose a payment method.";
  if (Object.keys(fields).length > 0) throw badRequest(Object.values(fields)[0], fields);

  // 5. The user must have seen the same total.
  if (body.expectedTotal !== undefined && Math.abs(Number(body.expectedTotal) - totals.total) > 0.001) {
    throw conflict(`Prices have changed. The new total is $${totals.total.toFixed(2)}, please review your cart.`);
  }

  // 6. Save the order and charge the wallet TOGETHER: if the payment fails,
  //    the order is not saved either.
  const couriers = getSetting("couriers");
  const id = randomUUID();
  const createdAt = now.toISOString();
  transaction(getDb(), () => {
    if (body.paymentMethod === "wallet") {
      addTransaction(userId, "payment", -totals.total, `Order at ${store.name}`);
    }
    getDb()
      .prepare(
        `INSERT INTO orders (id, user_id, store_id, items, subtotal, delivery_fee, total, building_id, room, slot_id,
                             payment_method, courier, status, status_times, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?)`
      )
      .run(
        id, userId, store.id, JSON.stringify(lines), totals.subtotal, totals.deliveryFee, totals.total,
        body.buildingId, body.room.trim().toUpperCase(), slot.id, body.paymentMethod,
        couriers[Math.floor(Math.random() * couriers.length)], JSON.stringify({ received: createdAt }), createdAt
      );
  });

  return getOrderFor(userId, id);
}

/* ------------------------------------------------------------------ */
/* Cancel and rate                                                     */
/* ------------------------------------------------------------------ */

// Only while "received". A wallet payment is refunded.
export function cancelOrder(userId, orderId) {
  const order = getOrderFor(userId, orderId); // also brings the status up to date
  if (order.status !== "received") throw conflict("This order can no longer be cancelled.");

  transaction(getDb(), () => {
    const statusTimes = JSON.stringify({ ...order.statusTimes, cancelled: new Date().toISOString() });
    const result = getDb()
      .prepare("UPDATE orders SET status = 'cancelled', status_times = ? WHERE id = ? AND status = 'received'")
      .run(statusTimes, orderId);
    if (result.changes === 0) throw conflict("This order can no longer be cancelled.");
    if (order.paymentMethod === "wallet") {
      addTransaction(userId, "refund", order.total, `Refund – ${order.storeName}`);
    }
  });
  return getOrderFor(userId, orderId);
}

// Only delivered orders, only once, 1–5 whole stars, comment up to 300 characters.
export function rateOrder(userId, orderId, { stars, comment }) {
  const order = getOrderFor(userId, orderId);
  if (order.status !== "delivered") throw conflict("You can rate an order once it has been delivered.");
  if (order.rating) throw conflict("You already rated this order.");
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw badRequest("Please choose 1 to 5 stars.", { stars: "Please choose 1 to 5 stars." });
  const text = typeof comment === "string" ? comment.trim() : "";
  if (text.length > 300) throw badRequest("Comment is too long (max 300 characters).", { comment: "Max 300 characters." });

  getDb().prepare("UPDATE orders SET rating_stars = ?, rating_comment = ? WHERE id = ?").run(stars, text, orderId);
  return getOrderFor(userId, orderId);
}
