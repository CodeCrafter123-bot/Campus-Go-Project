import { Platform } from "react-native";
import Constants from "expo-constants";

/*
 * Where is the backend (the Next.js server in /backend)?
 *
 * 1. If EXPO_PUBLIC_API_URL is set (e.g. in a .env file), use it.
 * 2. In the browser (web version): the same computer → http://localhost:3000
 * 3. On a phone with Expo Go: the backend runs on the same laptop as Expo,
 *    so we take the laptop's address from the Expo dev server
 *    (e.g. "172.20.10.2:8081" → http://172.20.10.2:3000).
 */

const API_PORT = 3000;

function detectApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  if (Platform.OS === "web") return `http://localhost:${API_PORT}`;
  const hostUri = Constants.expoConfig?.hostUri; // "172.20.10.2:8081"
  const host = hostUri ? hostUri.split(":")[0] : "localhost";
  return `http://${host}:${API_PORT}`;
}

export const API_URL = detectApiUrl();
