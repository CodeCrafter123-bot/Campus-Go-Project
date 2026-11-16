import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import usePersistedUserState from "../utils/usePersistedUserState";
import { makeId } from "../utils/storage";
import { round2 } from "../utils/pricing";
import { settings } from "../data";

/*
 * Simulated campus wallet.
 * transactions: [{ id, type: "topup" | "payment" | "refund", amount, description, date }]
 * amount is positive for money in, negative for money out.
 */

const WalletContext = createContext(null);

// Every new account starts with a welcome balance.
const INITIAL_WALLET = {
  balance: settings.initialWalletBalance,
  transactions: [
    {
      id: "welcome",
      type: "topup",
      amount: settings.initialWalletBalance,
      description: "Welcome credit",
      date: new Date().toISOString(),
    },
  ],
};

export function WalletProvider({ children }) {
  const { user } = useAuth();
  const [wallet, setWallet, ready] = usePersistedUserState("wallet", user?.id, INITIAL_WALLET);

  const addTransaction = useCallback(
    (type, amount, description) => {
      const tx = { id: makeId(), type, amount: round2(amount), description, date: new Date().toISOString() };
      setWallet((w) => ({
        balance: round2(w.balance + tx.amount),
        transactions: [tx, ...w.transactions],
      }));
      return tx;
    },
    [setWallet]
  );

  const topUp = useCallback(
    (amount) => {
      const value = Number(amount);
      if (!(value > 0)) return { error: "Enter an amount greater than 0." };
      if (value > 500) return { error: "Maximum top-up is $500." };
      addTransaction("topup", value, "Wallet top-up");
      return { error: null };
    },
    [addTransaction]
  );

  // Refused when the balance is insufficient.
  const pay = useCallback(
    (amount, description) => {
      if (amount > wallet.balance) {
        return { error: "Insufficient wallet balance. Please top up or pay cash on delivery." };
      }
      addTransaction("payment", -amount, description);
      return { error: null };
    },
    [wallet.balance, addTransaction]
  );

  const refund = useCallback(
    (amount, description) => addTransaction("refund", amount, description),
    [addTransaction]
  );

  const value = useMemo(
    () => ({ balance: wallet.balance, transactions: wallet.transactions, ready, topUp, pay, refund }),
    [wallet, ready, topUp, pay, refund]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
