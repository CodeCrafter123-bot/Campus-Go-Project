// Single entry point for the catalog (stores, products, buildings, slots, prices).
//
// The app starts with the copy bundled in campus.json, then CatalogContext
// downloads the real catalog from the server (GET /api/catalog) and calls
// applyCatalog(). The arrays/objects below are UPDATED IN PLACE, so every
// screen that imported them automatically sees the server's data.
// If the server can't be reached, the bundled copy keeps the app usable.
import data from "./campus.json";

export const settings = { ...data.settings };
export const stores = [...data.stores];
export const products = [...data.products];
export const buildings = [...data.buildings];
export const deliverySlots = [...data.deliverySlots];
export const printPricing = { ...data.printPricing };

export const STORE_CATEGORIES = [];

const replaceArray = (target, items) => target.splice(0, target.length, ...items);
const replaceObject = (target, values) => {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, values);
};

function updateCategories() {
  replaceArray(STORE_CATEGORIES, ["All", ...new Set(stores.map((s) => s.category))]);
}
updateCategories();

// Replaces the bundled data with the catalog received from the server.
export function applyCatalog(catalog) {
  replaceObject(settings, catalog.settings);
  replaceObject(printPricing, catalog.printPricing);
  replaceArray(stores, catalog.stores);
  replaceArray(products, catalog.products);
  replaceArray(buildings, catalog.buildings);
  replaceArray(deliverySlots, catalog.deliverySlots);
  updateCategories();
}

export const getStoreById = (id) => stores.find((s) => s.id === id);
export const getProductById = (id) => products.find((p) => p.id === id);
export const getProductsByStore = (storeId) => products.filter((p) => p.storeId === storeId);
export const getBuildingById = (id) => buildings.find((b) => b.id === id);
export const getSlotById = (id) => deliverySlots.find((s) => s.id === id);

// Groups a store's products by category → [{ title, data: [...] }]
export function getStoreMenuSections(storeId) {
  const groups = {};
  getProductsByStore(storeId).forEach((p) => {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  });
  return Object.keys(groups).map((title) => ({ title, data: groups[title] }));
}
