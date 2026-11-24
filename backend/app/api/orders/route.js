import { requireUser } from "@/lib/auth";
import { handler, readJson } from "@/lib/http";
import { listOrders, placeOrder } from "@/lib/orders";
import { getWallet } from "@/lib/wallet";

// GET /api/orders → the logged-in user's orders, newest first.
export const GET = handler(async (request) => {
  const user = requireUser(request);
  return Response.json({ orders: listOrders(user.id) });
});

// POST /api/orders → place an order from the cart.
// Body: { items, buildingId, room, slotId, paymentMethod: "wallet" | "cash", expectedTotal? }
// Response 201: { order, balance }
export const POST = handler(async (request) => {
  const user = requireUser(request);
  const body = await readJson(request);
  const order = placeOrder(user.id, body);
  return Response.json({ order, balance: getWallet(user.id).balance }, { status: 201 });
});
