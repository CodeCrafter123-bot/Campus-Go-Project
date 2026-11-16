import { useCallback, useEffect, useState } from "react";
import { loadJSON, saveJSON } from "./storage";

/**
 * Like useState, but the value is saved in AsyncStorage under
 * "user:<userId>:<name>", so every account on the phone keeps its own
 * cart / wallet / orders.
 *
 * Returns [value, setValue, ready]. `ready` is false while loading.
 * `initialValue` must be a constant (defined outside the component).
 */
export default function usePersistedUserState(name, userId, initialValue) {
  // `owner` remembers which user the value belongs to, so we never save
  // one user's data under another user's key while switching accounts.
  const [slot, setSlot] = useState({ owner: null, value: initialValue });

  // Load whenever the logged-in user changes.
  useEffect(() => {
    if (!userId) {
      setSlot({ owner: null, value: initialValue });
      return;
    }
    let active = true; // cleanup flag: ignore the result if the user changed meanwhile
    loadJSON(`user:${userId}:${name}`, initialValue).then((stored) => {
      if (active) setSlot({ owner: userId, value: stored });
    });
    return () => {
      active = false;
    };
  }, [userId, name, initialValue]);

  // Save after every change.
  useEffect(() => {
    if (slot.owner) saveJSON(`user:${slot.owner}:${name}`, slot.value);
  }, [slot, name]);

  const setValue = useCallback((updater) => {
    setSlot((prev) => ({
      ...prev,
      value: typeof updater === "function" ? updater(prev.value) : updater,
    }));
  }, []);

  const ready = Boolean(userId) && slot.owner === userId;
  return [ready ? slot.value : initialValue, setValue, ready];
}
