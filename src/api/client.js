import { API_URL } from "./config";

/*
 * One function to call the backend: api(path, { method, body, token }).
 *
 * It always returns an object and never throws:
 *   success → { data }
 *   failure → { error: "message for the user", fields?, status }
 * so the screens can simply do:  const { data, error } = await api(...)
 *
 * status 0 means the server could not be reached at all.
 */

const TIMEOUT_MS = 10000;

export const NETWORK_ERROR =
  "Can't reach the CampusGo server. Make sure the backend is running and your phone is on the same Wi-Fi as the computer.";

// Called when the server says the session is no longer valid (401 / frozen 403).
let onSessionEnded = null;
export function setSessionEndedHandler(fn) {
  onSessionEnded = fn;
}

export async function api(path, { method = "GET", body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = json.error || `Server error (${response.status}).`;
      // A logged-in request was refused because the account was deleted,
      // frozen, or the token expired → log out on the phone too.
      if (token && (response.status === 401 || (response.status === 403 && /frozen/i.test(error)))) {
        onSessionEnded?.(error);
      }
      return { error, fields: json.fields, status: response.status };
    }
    return { data: json };
  } catch {
    return { error: NETWORK_ERROR, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}
