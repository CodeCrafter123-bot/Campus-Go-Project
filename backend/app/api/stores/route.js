import { listStores } from "@/lib/catalog";
import { getStoreStatus } from "@/lib/time";
import { handler } from "@/lib/http";

// GET /api/stores → all stores, each with its live open/closed status
// (calculated with the server's clock).
export const GET = handler(async () => {
  const now = new Date();
  const stores = listStores().map((store) => ({ ...store, status: getStoreStatus(store, now) }));
  return Response.json({ stores });
});
