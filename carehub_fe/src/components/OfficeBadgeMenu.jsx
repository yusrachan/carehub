import { useState, useMemo, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useOffice } from "../context/OfficeContext";

export default function OfficeBadgeMenu({ className = "" }) {
  const { offices = [], currentOffice, currentOfficeId, switchOffice, loading } = useOffice();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const active = useMemo(() => {
    if (currentOffice) return currentOffice;
    return offices.find(o => String(o.id) === String(currentOfficeId)) || null;
  }, [currentOffice, offices, currentOfficeId]);

  useEffect(() => {
    function onClick(e) {
      if (!menuRef.current || !btnRef.current) return;
      if (!menuRef.current.contains(e.target) && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (loading) return null;
  if (!active) return null;

  const canSwitch = Array.isArray(offices) && offices.length > 1;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => canSwitch && setOpen(v => !v)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border text-sm 
                   ${canSwitch ? "hover:bg-gray-50" : "opacity-100 cursor-default"}`}
        aria-haspopup="menu"
        aria-expanded={open}>
        <Building2 className="w-4 h-4" />
        <span className="font-medium">{active.name}</span>
        {active.role && <span className="text-gray-500">• {active.role}</span>}
        {canSwitch && <ChevronDown className="w-4 h-4 opacity-70" />}
      </button>

      {/* Menu */}
      {open && canSwitch && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute z-50 mt-2 w-64 rounded-xl border bg-white shadow-lg p-1">
          <div className="px-3 py-2 text-xs text-gray-500">Changer de cabinet</div>
          <ul className="max-h-64 overflow-auto">
            {offices.map(o => {
              const isActive = String(o.id) === String(active.id);
              return (
                <li key={o.id}>
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg 
                               hover:bg-gray-50 ${isActive ? "bg-gray-50" : ""}`}
                    onClick={() => {
                      switchOffice(String(o.id));
                      setOpen(false);
                    }}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{o.name}</span>
                      {o.role && <span className="text-xs text-gray-500">{o.role}</span>}
                    </div>
                    {isActive && <Check className="w-4 h-4" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Lien de gestion */}
          <div className="border-t mt-1 pt-1">
            <a
              href="/settings"
              className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              onClick={() => setOpen(false)}>
              Gérer les cabinets
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
