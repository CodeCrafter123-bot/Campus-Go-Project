import { getStore, listProducts } from "@/lib/catalog";
import { getStoreStatus } from "@/lib/time";
import { handler, notFound } from "@/lib/http";

// GET /api/stores/:storeId → one store, its status and its products.
export const GET = handler(async (_request, { params }) => {
  const { storeId } = await params;
  const store = getStore(storeId);
  if (!store) throw notFound("Store not found.");
  return Response.json({
    store: { ...store, status: getStoreStatus(store) },
    products: listProducts(storeId),
  });
});
