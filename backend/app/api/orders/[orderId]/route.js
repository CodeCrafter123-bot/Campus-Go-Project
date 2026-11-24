import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";
import { getOrderFor } from "@/lib/orders";

// GET /api/orders/:orderId → one of YOUR orders, with its up-to-date status
// (the tracking screen calls this every few seconds).
export const GET = handler(async (request, { params }) => {
  const user = requireUser(request);
  const { orderId } = await params;
  return Response.json({ order: getOrderFor(user.id, orderId) });
});
