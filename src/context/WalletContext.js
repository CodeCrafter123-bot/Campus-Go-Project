import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

/*
 * Campus wallet, stored on the server.
 * GET  /api/wallet        → { balance, transactions }
 * POST /api/wallet/topup  → simulated card top-up
 * Payments and refunds happen on the server together with the order
 * (see OrdersContext), so the phone can never change the balance by itself.
 * transactions: [{ id, type: "topup" | "payment" | "refund", amount, description, date }]
 */

const WalletContext = createContext(null);
const EMPTY = { balance: 0, transactions: [] };

export function WalletProvider({ children }) {
  const { user, request } = useAuth();
  const [wallet, setWallet] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error: loadError } = await request("/wallet");
    if (data) setWallet(data);
    setError(loadError || null);
    setReady(true);
  }, [request]);

  // Load the wallet when a (non-admin) user logs in; clear it on logout.
  const userId = user?.role === "user" ? user.id : null;
  useEffect(() => {
    setWallet(EMPTY);
    setReady(false);
    if (userId) refresh();
  }, [userId, refresh]);

  const topUp = useCallback(
    async (amount) => {
      const { data, error: topUpError } = await request("/wallet/topup", { method: "POST", body: { amount: Number(amount) } });
      if (topUpError) return { error: topUpError };
      setWallet({ balance: data.balance, transactions: data.transactions });
      return { error: null };
    },
    [request]
  );

  const value = useMemo(
    () => ({ balance: wallet.balance, transactions: wallet.transactions, ready, error, refresh, topUp }),
    [wallet, ready, error, refresh, topUp]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
