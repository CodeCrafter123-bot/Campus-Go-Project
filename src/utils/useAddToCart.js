import { useCallback } from "react";
import { useCart } from "../context/CartContext";
import { getStoreById } from "../data";
import { showAlert } from "./dialog";

/**
 * Returns addToCart(item, onAdded).
 * Rule: the cart can only contain products from ONE store.
 * If the cart has items from another store, the user is asked to empty it first.
 */

//function to add to cart handles what happen when customer tries to add an item to the cart 
export default function useAddToCart() {
  const { addItem, storeId: cartStoreId } = useCart();

  return useCallback(
    (item, onAdded) => {
      //try adding the item first 
      const result = addItem(item);
      if (!result.conflict) {
        onAdded?.();
        return;
      }
      //if crat is empty add the item 
      //else ask the customer and alert to start a new cart 
      const currentStore = getStoreById(cartStoreId)?.name || "another store";
      const newStore = getStoreById(item.storeId)?.name || "this store";
      showAlert(
        "Start a new cart?",
        `Your cart has items from ${currentStore}. You can only order from one store at a time.\n\nEmpty the cart and add this item from ${newStore}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Empty cart & add",
            style: "destructive",
            onPress: () => {
              addItem(item, { replace: true });
              onAdded?.();
            },
          },
        ]
      );
    },
    [addItem, cartStoreId]
  );
}
