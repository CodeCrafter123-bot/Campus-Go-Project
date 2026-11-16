// Single entry point for the mock data (acts like a tiny local "API").
import data from "./campus.json";

export const settings = data.settings;
export const stores = data.stores;
export const products = data.products;
export const buildings = data.buildings;
export const deliverySlots = data.deliverySlots;
export const printPricing = data.printPricing;
export const couriers = data.couriers;

export const STORE_CATEGORIES = ["All", ...new Set(stores.map((s) => s.category))];

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
