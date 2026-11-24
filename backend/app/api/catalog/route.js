import { getCatalog } from "@/lib/catalog";
import { handler } from "@/lib/http";

// GET /api/catalog → everything the app loads at start-up, in one request:
// { settings, printPricing, stores, products, buildings, deliverySlots }
// Public: no login needed (the menu is not secret).
export const GET = handler(async () => Response.json(getCatalog()));
