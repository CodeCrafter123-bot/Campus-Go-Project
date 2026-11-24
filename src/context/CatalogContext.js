import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { applyCatalog } from "../data";

/*
 * Downloads the catalog (stores, products, buildings, delivery slots, prices)
 * from the server at start-up: GET /api/catalog (no login needed).
 * - ready:   false until the first download finished (or failed)
 * - offline: true if the server couldn't be reached → the bundled copy is used
 * - version: changes after every successful download, so screens re-render
 */

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [version, setVersion] = useState(0);

  const refreshCatalog = useCallback(async () => {
    const { data, error } = await api("/catalog");
    if (data) {
      applyCatalog(data);
      setOffline(false);
      setVersion((v) => v + 1);
    } else {
      setOffline(true);
    }
    setReady(true);
    return { error };
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const value = useMemo(() => ({ ready, offline, version, refreshCatalog }), [ready, offline, version, refreshCatalog]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
