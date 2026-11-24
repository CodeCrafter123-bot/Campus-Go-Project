import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";
import { cancelOrder } from "@/lib/orders";
import { getWallet } from "@/lib/wallet";

// POST /api/orders/:orderId/cancel → only while "Received"; wallet payments are refunded.
// Response: { order, balance }
export const POST = handler(async (request, { params }) => {
  const user = requireUser(request);
  const { orderId } = await params;
  const order = cancelOrder(user.id, orderId);
  return Response.json({ order, balance: getWallet(user.id).balance });
});
