import { getProduct } from "@/lib/catalog";
import { handler, notFound } from "@/lib/http";

// GET /api/products/:productId → one product with its sizes and extras.
export const GET = handler(async (_request, { params }) => {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) throw notFound("Product not found.");
  return Response.json({ product });
});
