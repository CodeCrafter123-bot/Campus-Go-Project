import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { useWallet } from "./WalletContext";
import usePersistedUserState from "../utils/usePersistedUserState";
import { makeId } from "../utils/storage";
import { getOrderTotals, meetsMinimumOrder, formatPrice } from "../utils/pricing";
import { slotLabel } from "../utils/time";
import { couriers, getStoreById, getBuildingById, settings } from "../data";

/*
 * Orders are simulated: the status is advanced by a timer on the tracking screen.
 */

export const ORDER_STATUSES = ["received", "preparing", "on_the_way", "delivered"];

export const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const OrdersContext = createContext(null);
const NO_ORDERS = [];

export function OrdersProvider({ children }) {
  const { user } = useAuth();
  const cart = useCart();
  const wallet = useWallet();
  const [orders, setOrders, ready] = usePersistedUserState("orders", user?.id, NO_ORDERS);

  const updateOrder = useCallback(
    (id, changes) => setOrders((list) => list.map((o) => (o.id === id ? { ...o, ...changes } : o))),
    [setOrders]
  );

  /**
   * Turns the current cart into an order.
   * details = { buildingId, room, slot, paymentMethod: "wallet" | "cash" }
   * Returns { order } or { error }.
   */
  const placeOrder = useCallback(
    ({ buildingId, room, slot, paymentMethod }) => {
      if (cart.items.length === 0) return { error: "Your cart is empty." };
      if (!meetsMinimumOrder(cart.subtotal)) {
        return { error: `Minimum order is ${formatPrice(settings.minimumOrder)}.` };
      }
      if (!buildingId) return { error: "Please choose a building." };
      if (!room || !room.trim()) return { error: "Please enter the room number." };
      if (!slot) return { error: "Please choose a delivery time." };

      const store = getStoreById(cart.storeId);
      const totals = getOrderTotals(cart.subtotal);
      const id = makeId();

      if (paymentMethod === "wallet") {
        const result = wallet.pay(totals.total, `Order at ${store.name}`);
        if (result.error) return { error: result.error };
      }

      const now = new Date().toISOString();
      const order = {
        id,
        storeId: store.id,
        storeName: store.name,
        items: cart.items,
        ...totals,
        buildingId,
        buildingName: getBuildingById(buildingId)?.name,
        room: room.trim(),
        slotId: slot.id,
        slotLabel: slotLabel(slot),
        paymentMethod,
        courier: couriers[Math.floor(Math.random() * couriers.length)],
        status: "received",
        statusTimes: { received: now },
        createdAt: now,
        rating: null,
      };

      setOrders((list) => [order, ...list]);
      cart.clearCart();
      return { order };
    },
    [cart, wallet, setOrders]
  );

  // Moves an order to its next status (used by the tracking timer).
  const advanceStatus = useCallback(
    (id) => {
      setOrders((list) =>
        list.map((o) => {
          const index = ORDER_STATUSES.indexOf(o.status);
          if (o.id !== id || index === -1 || index === ORDER_STATUSES.length - 1) return o;
          const next = ORDER_STATUSES[index + 1];
          return { ...o, status: next, statusTimes: { ...o.statusTimes, [next]: new Date().toISOString() } };
        })
      );
    },
    [setOrders]
  );

  // Only allowed while the order is still "received". Wallet payments are refunded.
  const cancelOrder = useCallback(
    (id) => {
      const order = orders.find((o) => o.id === id);
      if (!order || order.status !== "received") {
        return { error: "This order can no longer be cancelled." };
      }
      if (order.paymentMethod === "wallet") wallet.refund(order.total, `Refund – ${order.storeName}`);
      updateOrder(id, {
        status: "cancelled",
        statusTimes: { ...order.statusTimes, cancelled: new Date().toISOString() },
      });
      return { error: null };
    },
    [orders, wallet, updateOrder]
  );

  const rateOrder = useCallback(
    (id, stars, comment) => updateOrder(id, { rating: { stars, comment: comment.trim() } }),
    [updateOrder]
  );

  const getOrder = useCallback((id) => orders.find((o) => o.id === id), [orders]);

  const value = useMemo(
    () => ({ orders, ready, placeOrder, advanceStatus, cancelOrder, rateOrder, getOrder }),
    [orders, ready, placeOrder, advanceStatus, cancelOrder, rateOrder, getOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
