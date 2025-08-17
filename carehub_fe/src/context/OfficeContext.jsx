import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api";

const LS_KEY = "current_office_id";
const OfficeContext = createContext(undefined);

export function OfficeProvider({ children }) {
  const [offices, setOffices] = useState([]);
  const [currentOfficeId, setCurrentOfficeId] = useState(localStorage.getItem(LS_KEY));
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/offices/my/");
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setOffices(list);

        // Choisir un cabinet valide
        let wanted = localStorage.getItem(LS_KEY);
        if (!wanted || !list.some(o => String(o.id) === String(wanted))) {
          wanted = list.length ? String(list[0].id) : null;
        }
        setCurrentOfficeId(wanted);
        if (wanted) localStorage.setItem(LS_KEY, wanted);
        else localStorage.removeItem(LS_KEY);
      } catch (e) {
        console.warn("OfficeContext: /offices/my/ failed", e);
        setOffices([]);
        setCurrentOfficeId(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [location.pathname]);

  const currentOffice = useMemo(
    () => offices.find(o => String(o.id) === String(currentOfficeId)) || null,
    [offices, currentOfficeId]
  );

  const switchOffice = (id) => {
    const s = String(id);
    setCurrentOfficeId(s);
    localStorage.setItem(LS_KEY, s);
  };

  return (
    <OfficeContext.Provider value={{ loading, offices, currentOffice, currentOfficeId, switchOffice }}>
      {children}
    </OfficeContext.Provider>
  );
}

export function useOffice() {
  const ctx = useContext(OfficeContext);
  if (!ctx) throw new Error("useOffice must be used within OfficeProvider");
  return ctx;
}
