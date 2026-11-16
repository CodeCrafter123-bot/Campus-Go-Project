// Money and business rules: delivery fee, minimum order, printing price.
import { settings, printPricing } from "../data";

export const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

// Avoid floating-point noise like 0.30000000000000004
export const round2 = (value) => Math.round(value * 100) / 100;

// Unit price of a product with the chosen size and extras.
export function getUnitPrice(product, size, extras = []) {
  const sizeExtra = size ? size.extra : 0;
  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  return round2(product.price + sizeExtra + extrasTotal);
}

// Free delivery from $10, otherwise $0.50 (no fee on an empty cart).
export function getDeliveryFee(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeDeliveryFrom ? 0 : settings.deliveryFee;
}

export const meetsMinimumOrder = (subtotal) => subtotal >= settings.minimumOrder;

export function getOrderTotals(subtotal) {
  const deliveryFee = getDeliveryFee(subtotal);
  return {
    subtotal: round2(subtotal),
    deliveryFee,
    total: round2(subtotal + deliveryFee),
  };
}

/**
 * Printing price.
 * job = { pages, copies, color: boolean, doubleSided: boolean, binding: "none"|"staple"|"spiral" }
 * Per-page price × pages × copies (−10% when double-sided) + binding per copy.
 */
export function calcPrintPrice({ pages, copies, color, doubleSided, binding }) {
  const p = Number(pages) || 0;
  const c = Number(copies) || 0;
  if (p <= 0 || c <= 0) return { perCopy: 0, total: 0 };
  let pagePrice = color ? printPricing.color : printPricing.bw;
  if (doubleSided) pagePrice *= 1 - printPricing.doubleSidedDiscount;
  const perCopy = round2(p * pagePrice + (printPricing.binding[binding] || 0));
  return { perCopy, total: round2(perCopy * c) };
}

// Returns an error message or null.
export function validatePrintJob({ name, pages, copies }) {
  const p = Number(pages);
  const c = Number(copies);
  if (!name || !name.trim()) return "Please choose a document.";
  if (!Number.isInteger(p) || p <= 0) return "Number of pages must be greater than 0.";
  if (p > printPricing.maxPages) return `Maximum ${printPricing.maxPages} pages per order.`;
  if (!Number.isInteger(c) || c <= 0) return "Number of copies must be greater than 0.";
  return null;
}
