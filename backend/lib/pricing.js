import { getSetting } from "@/lib/db";
import { round2 } from "@/lib/wallet";

/*
 * Money rules (same as the app's src/utils/pricing.js), but the values come
 * from the database settings. The server ALWAYS recalculates prices itself:
 * it never trusts a price sent by the app.
 */

// Free delivery from $10, otherwise $0.50 (no fee on an empty cart).
export function getDeliveryFee(subtotal) {
  const settings = getSetting("settings");
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeDeliveryFrom ? 0 : settings.deliveryFee;
}

export function getOrderTotals(subtotal) {
  const deliveryFee = getDeliveryFee(subtotal);
  return { subtotal: round2(subtotal), deliveryFee, total: round2(subtotal + deliveryFee) };
}

/**
 * Printing price of ONE copy.
 * job = { pages, color: boolean, doubleSided: boolean, binding: "none" | "staple" | "spiral" }
 * Per-page price × pages (−10% when double-sided) + binding.
 */
export function calcPrintPerCopy({ pages, color, doubleSided, binding }) {
  const pricing = getSetting("printPricing");
  let pagePrice = color ? pricing.color : pricing.bw;
  if (doubleSided) pagePrice *= 1 - pricing.doubleSidedDiscount;
  return round2(pages * pagePrice + (pricing.binding[binding] || 0));
}

// Returns an error message or null.
export function validatePrintJob(job, copies) {
  const pricing = getSetting("printPricing");
  if (!job || typeof job !== "object") return "Print job details are missing.";
  if (typeof job.name !== "string" || !job.name.trim()) return "Please choose a document.";
  if (job.name.trim().length > 100) return "Document name is too long.";
  if (!Number.isInteger(job.pages) || job.pages <= 0) return "Number of pages must be greater than 0.";
  if (job.pages > pricing.maxPages) return `Maximum ${pricing.maxPages} pages per order.`;
  if (!Number.isInteger(copies) || copies <= 0) return "Number of copies must be greater than 0.";
  if (copies > pricing.maxCopies) return `Maximum ${pricing.maxCopies} copies per order.`;
  if (typeof job.color !== "boolean" || typeof job.doubleSided !== "boolean") return "Invalid print options.";
  if (!(job.binding in pricing.binding)) return "Invalid binding option.";
  return null;
}
