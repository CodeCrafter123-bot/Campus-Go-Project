import { requireUser } from "@/lib/auth";
import { handler, readJson } from "@/lib/http";
import { rateOrder } from "@/lib/orders";

// POST /api/orders/:orderId/rate → rate a delivered order once.
// Body: { stars: 1-5, comment? }
export const POST = handler(async (request, { params }) => {
  const user = requireUser(request);
  const { orderId } = await params;
  const body = await readJson(request);
  return Response.json({ order: rateOrder(user.id, orderId, body) });
});
