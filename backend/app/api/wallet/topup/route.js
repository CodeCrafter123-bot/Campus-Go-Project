import { getDb, transaction } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { badRequest, handler, readJson } from "@/lib/http";
import { addTransaction, getWallet, validateTopUp } from "@/lib/wallet";

// POST /api/wallet/topup → simulated card top-up.
// Body: { amount }   (more than 0, at most $500)
// Response: { balance, transactions, transaction }
export const POST = handler(async (request) => {
  const user = requireUser(request);
  const { amount } = await readJson(request);

  const error = validateTopUp(amount);
  if (error) throw badRequest(error, { amount: error });

  const tx = transaction(getDb(), () => addTransaction(user.id, "topup", Number(amount), "Wallet top-up"));
  return Response.json({ ...getWallet(user.id), transaction: tx });
});
