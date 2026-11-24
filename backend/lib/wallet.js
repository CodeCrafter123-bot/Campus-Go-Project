import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { badRequest } from "@/lib/http";

/*
 * Campus wallet.
 * The balance is stored on the user (users.wallet_balance) and every change
 * is also written to wallet_transactions, so the history always explains the balance.
 * Amounts: positive = money in (top-up, refund), negative = money out (payment).
 */

export const MAX_TOP_UP = 500;

// Money is rounded to cents to avoid errors like 0.1 + 0.2 = 0.30000000000000004.
export const round2 = (value) => Math.round(value * 100) / 100;

const toTransaction = (row) => ({
  id: row.id,
  type: row.type,
  amount: row.amount,
  description: row.description,
  date: row.created_at,
});

export function getWallet(userId) {
  const db = getDb();
  const { wallet_balance: balance } = db.prepare("SELECT wallet_balance FROM users WHERE id = ?").get(userId);
  const transactions = db
    .prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC")
    .all(userId)
    .map(toTransaction);
  return { balance, transactions };
}

/*
 * Adds a transaction and updates the balance.
 * For a payment (negative amount) the UPDATE only works if the balance is
 * high enough: the check and the change happen in ONE SQL statement, so two
 * payments sent at the same moment can never make the balance negative.
 * Must be called inside a transaction() together with the rest of the work.
 */
export function addTransaction(userId, type, amount, description) {
  const db = getDb();
  const value = round2(amount);
  const result = db
    .prepare(
      "UPDATE users SET wallet_balance = ROUND(wallet_balance + ?, 2) WHERE id = ? AND wallet_balance + ? >= -0.001"
    )
    .run(value, userId, value);
  if (result.changes === 0) {
    throw badRequest("Insufficient wallet balance. Please top up or pay cash on delivery.");
  }

  const tx = { id: randomUUID(), type, amount: value, description, date: new Date().toISOString() };
  db.prepare(
    "INSERT INTO wallet_transactions (id, user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(tx.id, userId, tx.type, tx.amount, tx.description, tx.date);
  return tx;
}

// Same rules as the app: more than 0, at most $500, at most 2 decimals.
export function validateTopUp(amount) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "Enter an amount greater than 0.";
  if (value > MAX_TOP_UP) return `Maximum top-up is $${MAX_TOP_UP}.`;
  if (round2(value) !== value) return "Use at most 2 decimals.";
  return null;
}
