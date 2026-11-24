import { getUserRow, requireAdmin, toPublicUser } from "@/lib/auth";
import { handler, notFound, readJson } from "@/lib/http";
import { deleteUser, setFrozen } from "@/lib/admin";
import { listOrders } from "@/lib/orders";
import { getWallet } from "@/lib/wallet";

// GET /api/admin/users/:userId → one account with its wallet and orders. Admins only.
export const GET = handler(async (request, { params }) => {
  requireAdmin(request);
  const { userId } = await params;
  const row = getUserRow(userId);
  if (!row) throw notFound("User not found.");
  return Response.json({ user: toPublicUser(row), wallet: getWallet(userId), orders: listOrders(userId) });
});

// PATCH /api/admin/users/:userId → freeze or unfreeze. Body: { frozen: true | false }
export const PATCH = handler(async (request, { params }) => {
  const admin = requireAdmin(request);
  const { userId } = await params;
  const { frozen } = await readJson(request);
  return Response.json({ user: setFrozen(admin, userId, frozen) });
});

// DELETE /api/admin/users/:userId → delete the account and all its data.
export const DELETE = handler(async (request, { params }) => {
  const admin = requireAdmin(request);
  const { userId } = await params;
  deleteUser(admin, userId);
  return Response.json({ ok: true });
});
