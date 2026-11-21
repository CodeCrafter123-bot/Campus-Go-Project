import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON, removeKey, makeId } from "../utils/storage";
import { validateEmail } from "../utils/validation";

/*
 * Simulated authentication (no real backend).
 * - All accounts are stored in AsyncStorage under "users".
 * - The id of the logged-in user is stored under "session".
 * - Every account has a `role` ("user" or "admin") and a `frozen` flag.
 *   Frozen accounts cannot log in. Admins manage accounts from the Admin Panel.
 * Note: passwords are stored as plain text because this is a mock app;
 * a real app would never do this.
 */

const AuthContext = createContext(null);

// Demo account created on first launch, handy for the live demonstration.
const DEMO_USER = {
  id: "demo",
  fullName: "Demo Student",
  email: "demo@ua.edu.lb",
  password: "campus123",
  universityId: "202312345",
  faculty: "Engineering",
  phone: "71123456",
  role: "user",
  frozen: false,
  savedLocations: [{ id: "loc-1", label: "My Lab", buildingId: "B", room: "204" }],
};

// Main administrator. Created automatically if missing, and it can never be
// frozen or deleted (so the app always has at least one admin).
export const ROOT_ADMIN_ID = "admin";
const ROOT_ADMIN = {
  id: ROOT_ADMIN_ID,
  fullName: "System Administrator",
  email: "admin@ua.edu.lb",
  password: "admin123",
  universityId: "ADMIN",
  faculty: "Administration",
  phone: "",
  role: "admin",
  frozen: false,
  savedLocations: [],
};

// Per-user data saved by usePersistedUserState (removed when a user is deleted).
const PER_USER_KEYS = ["wallet", "cart", "orders"];

// Never expose the password to the screens.
const publicUser = (u) => {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
};

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [booting, setBooting] = useState(true);

  // Load accounts + session once at app start.
  useEffect(() => {
    (async () => {
      let storedUsers = (await loadJSON("users", null)) || [];
      let changed = false;
      if (storedUsers.length === 0) {
        storedUsers = [DEMO_USER];
        changed = true;
      }
      if (!storedUsers.some((u) => u.id === ROOT_ADMIN_ID)) {
        storedUsers = [...storedUsers, ROOT_ADMIN];
        changed = true;
      } else if (storedUsers.some((u) => u.id === ROOT_ADMIN_ID && u.email !== ROOT_ADMIN.email)) {
        // Older installs: bring the main admin's email up to date.
        storedUsers = storedUsers.map((u) => (u.id === ROOT_ADMIN_ID ? { ...u, email: ROOT_ADMIN.email } : u));
        changed = true;
      }
      if (changed) await saveJSON("users", storedUsers);

      const session = await loadJSON("session", null);
      setUsers(storedUsers);
      // A frozen account is not allowed to resume an old session.
      if (session && storedUsers.some((u) => u.id === session && !u.frozen)) setUserId(session);
      setBooting(false);
    })();
  }, []);

  const persistUsers = useCallback((next) => {
    setUsers(next);
    saveJSON("users", next);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || found.password !== password) {
        return { error: "Incorrect email or password." };
      }
      if (found.frozen) {
        return { error: "This account has been frozen. Please contact the administrator." };
      }
      setUserId(found.id);
      await saveJSON("session", found.id);
      return { error: null };
    },
    [users]
  );

  // `form` is already validated by the sign-up screen.
  const signUp = useCallback(
    async (form) => {
      const email = form.email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return { error: "An account with this email already exists." };
      }
      if (users.some((u) => u.universityId === form.universityId.trim())) {
        return { error: "An account with this ID already exists." };
      }
      const newUser = {
        id: makeId(),
        fullName: form.fullName.trim(),
        email,
        password: form.password,
        universityId: form.universityId.trim(),
        faculty: form.faculty.trim(),
        phone: form.phone.trim(),
        role: "user", // sign-up can never create an admin
        frozen: false,
        createdAt: new Date().toISOString(),
        savedLocations: [],
      };
      persistUsers([...users, newUser]);
      setUserId(newUser.id);
      await saveJSON("session", newUser.id);
      return { error: null };
    },
    [users, persistUsers]
  );

  const logout = useCallback(async () => {
    setUserId(null);
    await removeKey("session");
  }, []);

  const updateUser = useCallback(
    (changes) => {
      persistUsers(users.map((u) => (u.id === userId ? { ...u, ...changes } : u)));
    },
    [users, userId, persistUsers]
  );

  // A frozen or deleted account behaves like a logged-out one.
  const storedCurrent = users.find((u) => u.id === userId);
  const currentUser = storedCurrent && !storedCurrent.frozen ? storedCurrent : undefined;
  const isAdmin = currentUser?.role === "admin";

  const addLocation = useCallback(
    (location) => {
      if (!currentUser) return;
      updateUser({ savedLocations: [...currentUser.savedLocations, { id: makeId(), ...location }] });
    },
    [currentUser, updateUser]
  );

  const removeLocation = useCallback(
    (locationId) => {
      if (!currentUser) return;
      updateUser({ savedLocations: currentUser.savedLocations.filter((l) => l.id !== locationId) });
    },
    [currentUser, updateUser]
  );

  /* ---------------- Admin actions (only work for admin accounts) ---------------- */

  // Shared checks for freeze / delete. Returns an error message or null.
  const checkTarget = useCallback(
    (targetId, action) => {
      if (!isAdmin) return "Only admins can do this.";
      if (!users.some((u) => u.id === targetId)) return "User not found.";
      if (targetId === userId) return `You can't ${action} your own account.`;
      if (targetId === ROOT_ADMIN_ID) return `The main admin account can't be ${action}d.`;
      return null;
    },
    [isAdmin, users, userId]
  );

  const adminUsers = useMemo(() => (isAdmin ? users.map(publicUser) : []), [isAdmin, users]);

  // Freeze (frozen = true) or unfreeze (frozen = false) an account.
  const setFrozen = useCallback(
    (targetId, frozen) => {
      const error = checkTarget(targetId, "freeze");
      if (error) return { error };
      persistUsers(users.map((u) => (u.id === targetId ? { ...u, frozen } : u)));
      return { error: null };
    },
    [checkTarget, users, persistUsers]
  );

  const createAdmin = useCallback(
    ({ fullName, email, password }) => {
      if (!isAdmin) return { error: "Only admins can do this." };
      const emailError = validateEmail(email);
      if (emailError) return { error: emailError };
      const cleanEmail = email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { error: "An account with this email already exists." };
      }
      const newAdmin = {
        id: makeId(),
        fullName: fullName.trim(),
        email: cleanEmail,
        password,
        universityId: "ADMIN",
        faculty: "Administration",
        phone: "",
        role: "admin",
        frozen: false,
        createdAt: new Date().toISOString(),
        savedLocations: [],
      };
      persistUsers([...users, newAdmin]);
      return { error: null };
    },
    [isAdmin, users, persistUsers]
  );

  const deleteUser = useCallback(
    async (targetId) => {
      const error = checkTarget(targetId, "delete");
      if (error) return { error };
      persistUsers(users.filter((u) => u.id !== targetId));
      // Also remove the user's wallet, cart and orders.
      await Promise.all(PER_USER_KEYS.map((name) => removeKey(`user:${targetId}:${name}`)));
      return { error: null };
    },
    [checkTarget, users, persistUsers]
  );

  const value = useMemo(
    () => ({
      user: publicUser(currentUser),
      booting,
      login,
      signUp,
      logout,
      updateUser,
      addLocation,
      removeLocation,
      adminUsers,
      setFrozen,
      createAdmin,
      deleteUser,
    }),
    [currentUser, booting, login, signUp, logout, updateUser, addLocation, removeLocation, adminUsers, setFrozen, createAdmin, deleteUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}