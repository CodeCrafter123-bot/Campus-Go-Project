import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON, removeKey } from "../utils/storage";
import { api, setSessionEndedHandler } from "../api/client";

/*
 * Authentication through the CampusGo backend (Next.js, see /backend).
 * - Login / sign-up send the form to the server, which answers with a TOKEN.
 * - The token is saved on the phone (AsyncStorage key "token") and sent with
 *   every request, so the user stays logged in after closing the app.
 * - Passwords are only checked and stored (hashed) on the server.
 * - If the server says the account was frozen or deleted, the app logs out.
 * Admin actions (users list, freeze, delete, create admin) also go through the API.
 */

const AuthContext = createContext(null);

// Main administrator id: it can never be frozen or deleted (also enforced by the server).
export const ROOT_ADMIN_ID = "admin";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null); // e.g. "This account has been frozen…"
  const [adminUsers, setAdminUsers] = useState([]);

  const startSession = useCallback(async (newToken, newUser) => {
    await saveJSON("token", newToken);
    setToken(newToken);
    setUser(newUser);
    setSessionMessage(null);
  }, []);

  const endSession = useCallback(async (message = null) => {
    await removeKey("token");
    setToken(null);
    setUser(null);
    setAdminUsers([]);
    setSessionMessage(message);
  }, []);

  // At start-up: if a token is saved, ask the server who we are.
  const restoreSession = useCallback(async () => {
    setBooting(true);
    setConnectionError(null);
    // The old offline version kept every account (with plain-text passwords)
    // on the phone: remove that data, it is not used any more.
    await Promise.all([removeKey("users"), removeKey("session")]);

    const saved = await loadJSON("token", null);
    if (saved) {
      const { data, error, status } = await api("/auth/me", { token: saved });
      if (data) {
        setToken(saved);
        setUser(data.user);
      } else if (status === 0) {
        setConnectionError(error); // server unreachable: keep the token, offer "Try again"
      } else {
        await endSession(status === 403 ? error : null); // expired, deleted or frozen
      }
    }
    setBooting(false);
  }, [endSession]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Any request refused with 401 / "frozen" logs the user out (see api/client.js).
  useEffect(() => {
    setSessionEndedHandler((message) => endSession(/frozen/i.test(message) ? message : "Your session has ended. Please log in again."));
    return () => setSessionEndedHandler(null);
  }, [endSession]);

  // Shortcut for calling the API as the logged-in user.
  const request = useCallback((path, options = {}) => api(path, { ...options, token }), [token]);

  const login = useCallback(
    async (email, password) => {
      const { data, error } = await api("/auth/login", { method: "POST", body: { email: email.trim(), password } });
      if (error) return { error };
      await startSession(data.token, data.user);
      return { error: null };
    },
    [startSession]
  );

  // `form` is already validated by the sign-up screen; the server checks it again.
  const signUp = useCallback(
    async (form) => {
      const { data, error, fields } = await api("/auth/signup", { method: "POST", body: form });
      if (error) return { error, fields };
      await startSession(data.token, data.user);
      return { error: null };
    },
    [startSession]
  );

  const logout = useCallback(() => endSession(null), [endSession]);

  // Edit your own name / phone / faculty.
  const updateProfile = useCallback(
    async (changes) => {
      const { data, error, fields } = await request("/auth/me", { method: "PATCH", body: changes });
      if (error) return { error, fields };
      setUser(data.user);
      return { error: null };
    },
    [request]
  );

  const addLocation = useCallback(
    async (location) => {
      const { data, error, fields } = await request("/locations", { method: "POST", body: location });
      if (error) return { error, fields };
      setUser((u) => ({ ...u, savedLocations: data.savedLocations }));
      return { error: null };
    },
    [request]
  );

  const removeLocation = useCallback(
    async (locationId) => {
      const { data, error } = await request(`/locations/${locationId}`, { method: "DELETE" });
      if (error) return { error };
      setUser((u) => ({ ...u, savedLocations: data.savedLocations }));
      return { error: null };
    },
    [request]
  );

  /* ---------------- Admin actions (the server checks that you are an admin) ---------------- */

  const isAdmin = user?.role === "admin";

  const refreshUsers = useCallback(async () => {
    const { data, error } = await request("/admin/users");
    if (data) setAdminUsers(data.users);
    return { error };
  }, [request]);

  // Load the accounts list as soon as an admin is logged in.
  useEffect(() => {
    if (isAdmin) refreshUsers();
  }, [isAdmin, refreshUsers]);

  // Freeze (frozen = true) or unfreeze (frozen = false) an account.
  const setFrozen = useCallback(
    async (targetId, frozen) => {
      const { data, error } = await request(`/admin/users/${targetId}`, { method: "PATCH", body: { frozen } });
      if (error) return { error };
      setAdminUsers((list) => list.map((u) => (u.id === targetId ? data.user : u)));
      return { error: null };
    },
    [request]
  );

  const createAdmin = useCallback(
    async (form) => {
      const { data, error, fields } = await request("/admin/users", { method: "POST", body: form });
      if (error) return { error, fields };
      setAdminUsers((list) => [...list, data.user]);
      return { error: null };
    },
    [request]
  );

  // Deletes the account with its wallet history, locations and orders (on the server).
  const deleteUser = useCallback(
    async (targetId) => {
      const { error } = await request(`/admin/users/${targetId}`, { method: "DELETE" });
      if (error) return { error };
      setAdminUsers((list) => list.filter((u) => u.id !== targetId));
      return { error: null };
    },
    [request]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      connectionError,
      sessionMessage,
      retryConnection: restoreSession,
      request,
      login,
      signUp,
      logout,
      updateProfile,
      addLocation,
      removeLocation,
      adminUsers,
      refreshUsers,
      setFrozen,
      createAdmin,
      deleteUser,
    }),
    [user, token, booting, connectionError, sessionMessage, restoreSession, request, login, signUp, logout, updateProfile, addLocation, removeLocation, adminUsers, refreshUsers, setFrozen, createAdmin, deleteUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
