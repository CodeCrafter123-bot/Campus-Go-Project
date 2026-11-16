import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadJSON, saveJSON, removeKey, makeId } from "../utils/storage";

/*
 * Simulated authentication (no real backend).
 * - All accounts are stored in AsyncStorage under "users".
 * - The id of the logged-in user is stored under "session".
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
  savedLocations: [{ id: "loc-1", label: "My Lab", buildingId: "B", room: "204" }],
};

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
      let storedUsers = await loadJSON("users", null);
      if (!storedUsers || storedUsers.length === 0) {
        storedUsers = [DEMO_USER];
        await saveJSON("users", storedUsers);
      }
      const session = await loadJSON("session", null);
      setUsers(storedUsers);
      if (session && storedUsers.some((u) => u.id === session)) setUserId(session);
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

  const currentUser = users.find((u) => u.id === userId);

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
    }),
    [currentUser, booting, login, signUp, logout, updateUser, addLocation, removeLocation]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
