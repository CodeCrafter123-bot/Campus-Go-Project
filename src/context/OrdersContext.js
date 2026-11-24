import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { useWallet } from "./WalletContext";
import { getOrderTotals } from "../utils/pricing";

/*
 * Orders, stored on the server.
 * - placeOrder sends the cart to POST /api/orders. The server checks every
 *   rule, recalculates the prices and takes the wallet payment.
 * - The status moves forward on the server by itself (Received → Preparing →
 *   On the way → Delivered); the tracking screen asks for updates.
 */

export const ORDER_STATUSES = ["received", "preparing", "on_the_way", "delivered"];

export const STATUS_LABELS = {
  received: "Received",
  preparing: "Preparing",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const OrdersContext = createContext(null);

// Only what the server needs from a cart line (it looks up the prices itself).
const toOrderItem = (item) =>
  item.type === "print"
    ? { type: "print", storeId: item.storeId, quantity: item.quantity, printJob: item.printJob }
    : {
        type: "product",
        storeId: item.storeId,
        productId: item.productId,
        quantity: item.quantity,
        size: item.size ? { label: item.size.label } : null,
        extras: (item.extras || []).map((e) => ({ label: e.label })),
      };

export function OrdersProvider({ children }) {
  const { user, request } = useAuth();
  const cart = useCart();
  const wallet = useWallet();
  const [orders, setOrders] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // Replaces one order in the list (or adds it at the top).
  const putOrder = useCallback(
    (order) =>
      setOrders((list) => (list.some((o) => o.id === order.id) ? list.map((o) => (o.id === order.id ? order : o)) : [order, ...list])),
    []
  );

  const refresh = useCallback(async () => {
    const { data, error: loadError } = await request("/orders");
    if (data) setOrders(data.orders);
    setError(loadError || null);
    setReady(true);
    return { error: loadError };
  }, [request]);

  // Load the orders when a (non-admin) user logs in; clear them on logout.
  const userId = user?.role === "user" ? user.id : null;
  useEffect(() => {
    setOrders([]);
    setReady(false);
    if (userId) refresh();
  }, [userId, refresh]);

  /**
   * Turns the current cart into an order.
   * details = { buildingId, room, slot, paymentMethod: "wallet" | "cash" }
   * Returns { order } or { error }.
   */
  const placeOrder = useCallback(
    async ({ buildingId, room, slot, paymentMethod }) => {
      if (cart.items.length === 0) return { error: "Your cart is empty." };
      const { data, error: placeError } = await request("/orders", {
        method: "POST",
        body: {
          items: cart.items.map(toOrderItem),
          buildingId,
          room: room.trim(),
          slotId: slot?.id,
          paymentMethod,
          // The total shown to the user: the server refuses the order if the real total is different.
          expectedTotal: getOrderTotals(cart.subtotal).total,
        },
      });
      if (placeError) return { error: placeError };
      putOrder(data.order);
      cart.clearCart();
      wallet.refresh(); // new balance + "payment" transaction
      return { order: data.order };
    },
    [cart, wallet, request, putOrder]
  );

  // Asks the server for the latest version of one order (used by the tracking screen).
  const refreshOrder = useCallback(
    async (id) => {
      const { data, error: loadError } = await request(`/orders/${id}`);
      if (data) putOrder(data.order);
      return { error: loadError };
    },
    [request, putOrder]
  );

  // Only allowed while the order is still "received". Wallet payments are refunded.
  const cancelOrder = useCallback(
    async (id) => {
      const { data, error: cancelError } = await request(`/orders/${id}/cancel`, { method: "POST" });
      if (cancelError) {
        refreshOrder(id); // show the real status (e.g. it is already being prepared)
        return { error: cancelError };
      }
      putOrder(data.order);
      wallet.refresh(); // "refund" transaction
      return { error: null };
    },
    [request, putOrder, refreshOrder, wallet]
  );

  const rateOrder = useCallback(
    async (id, stars, comment) => {
      const { data, error: rateError } = await request(`/orders/${id}/rate`, { method: "POST", body: { stars, comment } });
      if (rateError) return { error: rateError };
      putOrder(data.order);
      return { error: null };
    },
    [request, putOrder]
  );

  const getOrder = useCallback((id) => orders.find((o) => o.id === id), [orders]);

  const value = useMemo(
    () => ({ orders, ready, error, refresh, placeOrder, refreshOrder, cancelOrder, rateOrder, getOrder }),
    [orders, ready, error, refresh, placeOrder, refreshOrder, cancelOrder, rateOrder, getOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
