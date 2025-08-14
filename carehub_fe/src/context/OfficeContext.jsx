/*
1. Charge les cabinets de l'utilisateur
2. Choisis le cabinet courant
3. Expose ces infos partout via hook useOffice()
4. Mémorise le choix dans localStorage pour que user retrouve le même cabinet au prochain refresh
*/

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import http from '../lib/http';

const OfficeContext = createContext(null);

export function OfficeProvider({ children }) {
  const [currentOffice, setCurrentOffice] = useState(null);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const isPublic = location.pathname.startsWith('/login')
                || location.pathname.startsWith('/register')
                || location.pathname.startsWith('/register-join');

  useEffect(() => {
    let alive = true;

    (async () => {
      const token = localStorage.getItem('access');
      if (isPublic || !token) { 
        if (alive) setLoading(false);
        return;
      }

      try {
        const { data: me } = await http.get('/settings/me/');
        if (!alive) return;

        const list = Array.isArray(me.offices) ? me.offices.filter(o => o.is_active) : [];
        setOffices(list);

        const savedId = localStorage.getItem('currentOfficeId');
        const chosen = list.find(o => String(o.id) === String(savedId)) || list[0] || null;
        setCurrentOffice(chosen);
        if (chosen) localStorage.setItem('currentOfficeId', chosen.id);
      } catch (e) {
        console.warn('OfficeContext: échec /settings/me/', e);
        setOffices([]);
        setCurrentOffice(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [isPublic, location.pathname]);

  const value = useMemo(() => ({
    loading,
    offices,
    currentOffice,
    setCurrentOffice: (o) => {
      setCurrentOffice(o);
      if (o) localStorage.setItem('currentOfficeId', o.id);
      else localStorage.removeItem('currentOfficeId');
    }
  }), [loading, offices, currentOffice]);

  return <OfficeContext.Provider value={value}>{children}</OfficeContext.Provider>;
}

export function useOffice() {
  const ctx = useContext(OfficeContext);
  if (!ctx) throw new Error('useOffice must be used within OfficeProvider');
  return ctx;
}
