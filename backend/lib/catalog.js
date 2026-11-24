import { getDb, getSetting } from "@/lib/db";

/*
 * Reading the catalog (stores, products, buildings, delivery slots) from the
 * database. Every function returns objects in the SAME shape as the app's old
 * campus.json, so the screens don't need to change.
 */

const toStore = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  icon: row.icon,
  color: row.color,
  description: row.description,
  avgPrepMinutes: row.avg_prep_minutes,
  openingHours: JSON.parse(row.opening_hours),
});

const toProduct = (row) => {
  const product = {
    id: row.id,
    storeId: row.store_id,
    category: row.category,
    name: row.name,
    image: row.image,
    price: row.price,
    inStock: Boolean(row.in_stock),
  };
  if (row.description) product.description = row.description;
  if (row.options) product.options = JSON.parse(row.options);
  return product;
};

export const listStores = () => getDb().prepare("SELECT * FROM stores ORDER BY sort_order").all().map(toStore);

export function getStore(id) {
  const row = getDb().prepare("SELECT * FROM stores WHERE id = ?").get(id);
  return row ? toStore(row) : null;
}

export function listProducts(storeId) {
  const db = getDb();
  const rows = storeId
    ? db.prepare("SELECT * FROM products WHERE store_id = ? ORDER BY sort_order").all(storeId)
    : db.prepare("SELECT * FROM products ORDER BY sort_order").all();
  return rows.map(toProduct);
}

export function getProduct(id) {
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id);
  return row ? toProduct(row) : null;
}

export const listBuildings = () =>
  getDb().prepare("SELECT id, name FROM buildings ORDER BY sort_order").all().map((b) => ({ ...b }));

export const getBuilding = (id) => listBuildings().find((b) => b.id === id) || null;

export const listSlots = () =>
  getDb()
    .prepare("SELECT id, start_time AS start, end_time AS end FROM delivery_slots ORDER BY sort_order")
    .all()
    .map((s) => ({ ...s }));

export const getSlot = (id) => listSlots().find((s) => s.id === id) || null;

// Everything the app needs at start-up, in one request.
export function getCatalog() {
  return {
    settings: getSetting("settings"),
    printPricing: getSetting("printPricing"),
    stores: listStores(),
    products: listProducts(),
    buildings: listBuildings(),
    deliverySlots: listSlots(),
  };
}
