import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";
import { getWallet } from "@/lib/wallet";

// GET /api/wallet → { balance, transactions } of the logged-in user (newest first).
export const GET = handler(async (request) => {
  const user = requireUser(request);
  return Response.json(getWallet(user.id));
});
