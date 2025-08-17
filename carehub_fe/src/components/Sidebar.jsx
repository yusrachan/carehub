import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import axios from "axios";
import { useOffice } from "../context/OfficeContext";
import CurrentOfficeBadge from "./CurrentOfficeBadge";
import OfficeBadgeMenu from "./OfficeBadgeMenu";

function OfficeSwitcher() {
  let ctx;
  try { ctx = useOffice() } catch { return null}
  const { offices, currentOfficeId, switchOffice, loading } = useOffice()

  if (loading) {
    return (
      <div className="mt-4">
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!offices?.length) return null;
  if (offices.length === 1) {
    return (
      <div className="mt-4">
        <label className="block text-xs text-gray-600 mb-1">Cabinet</label>
        <div className="px-3 py-2 rounded-lg bg-white border">{offices[0].name}</div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <label htmlFor="office" className="block text-xs text-gray-600 mb-1">
        Cabinet courant
      </label>
      <select
        id="office"
        className="w-full border rounded-lg p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"
        value={currentOfficeId || ""}
        onChange={(e) => switchOffice(e.target.value)}>
        {offices.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  
  const linkBase = "block px-4 py-2 rounded-lg transition hover:bg-[#466896] hover:text-white";
  const linkActive = "bg-[#466896] text-white";
  const linkInactive = "text-[#333333]";

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/agenda", label: "Calendrier" },
    { to: "/invoices", label: "Factures" },
    { to: "/team", label: "Équipe" },
    { to: "/settings", label: "Paramètres" },
  ];

  const handleSignOut = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("current_office_id")
    delete axios.defaults.headers.common["Authorization"]
    navigate("/login")
  }
  
  return (
    <div className="w-64 h-screen bg-[#D9E1E8] p-6 flex flex-col justify-between">
      <div>
        <button
          className="m-4 p-2 text-[#466896] hover:text-[#254a72] focus:outline-none md:hidden" 
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="text-2xl font-bold mb-10 text-[#466896]">CareHub</div>
        <OfficeBadgeMenu/>

        <nav className={`space-y-3 mt-6 ${isOpen ? "block": "hidden"} md:block`}>
          {links.map(({ to, label }) => (
            <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`} end>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-sidebar-border pt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center px-4 py-2 text-[#333333] hover:bg-[#466896] hover:text-white rounded-lg transition">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
      </div>
    </div>
  );
}

