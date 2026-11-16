import { createContext, useCallback, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";
import usePersistedUserState from "../utils/usePersistedUserState";
import { makeId } from "../utils/storage";
import { round2 } from "../utils/pricing";

/*
 * Cart rules:
 * - The cart holds products from ONE store only (cart.storeId).
 * - Same product with the same options => quantity is increased.
 *
 * Cart item:
 * { key, type: "product" | "print", productId, storeId, name, image,
 *   unitPrice, quantity, size, extras, printJob }
 */

const CartContext = createContext(null);
const EMPTY_CART = { storeId: null, items: [] };

// Items with the same product + size + extras are merged into one line.
function itemKey(item) {
  if (item.type === "print") return `print-${makeId()}`; // every print job is unique
  const extras = (item.extras || []).map((e) => e.label).sort().join("+");
  return `${item.productId}|${item.size?.label || ""}|${extras}`;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart, ready] = usePersistedUserState("cart", user?.id, EMPTY_CART);

  // true when adding from `storeId` would mix two stores.
  const isOtherStore = useCallback(
    (storeId) => cart.items.length > 0 && cart.storeId !== storeId,
    [cart]
  );

  /**
   * Adds an item. Returns { conflict: true } (and adds nothing) if the cart
   * contains products from another store: the screen then asks the user
   * whether to empty the cart, and calls addItem again with { replace: true }.
   */
  const addItem = useCallback(
    (item, { replace = false } = {}) => {
      if (!replace && isOtherStore(item.storeId)) return { conflict: true };
      const key = itemKey(item);
      setCart((c) => {
        const base = replace || c.storeId !== item.storeId ? EMPTY_CART : c;
        const existing = base.items.find((i) => i.key === key);
        const items = existing
          ? base.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i))
          : [...base.items, { ...item, key }];
        return { storeId: item.storeId, items };
      });
      return { conflict: false };
    },
    [isOtherStore, setCart]
  );

  const updateQuantity = useCallback(
    (key, quantity) => {
      setCart((c) => {
        const items =
          quantity <= 0
            ? c.items.filter((i) => i.key !== key)
            : c.items.map((i) => (i.key === key ? { ...i, quantity } : i));
        return { storeId: items.length ? c.storeId : null, items };
      });
    },
    [setCart]
  );

  const removeItem = useCallback((key) => updateQuantity(key, 0), [updateQuantity]);

  const clearCart = useCallback(() => setCart(EMPTY_CART), [setCart]);

  // Used by "Reorder": replaces the whole cart with a previous order's items.
  const replaceCart = useCallback(
    (storeId, items) => setCart({ storeId, items: items.map((i) => ({ ...i, key: itemKey(i) })) }),
    [setCart]
  );

  const value = useMemo(() => {
    const itemCount = cart.items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = round2(cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
    return {
      storeId: cart.storeId,
      items: cart.items,
      itemCount,
      subtotal,
      ready,
      isOtherStore,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      replaceCart,
    };
  }, [cart, ready, isOtherStore, addItem, updateQuantity, removeItem, clearCart, replaceCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
