// Small wrapper around AsyncStorage that stores JSON and never throws.
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "campusgo:";

export async function loadJSON(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw != null ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("loadJSON failed", key, e);
    return fallback;
  }
}

export async function saveJSON(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("saveJSON failed", key, e);
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (e) {
    console.warn("removeKey failed", key, e);
  }
}

// Short unique id, e.g. "lq3k9x-4f2a"
export const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
