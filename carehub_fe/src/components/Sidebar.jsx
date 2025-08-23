import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import axios from "axios";
import OfficeBadgeMenu from "./OfficeBadgeMenu";

function SidebarLink({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-xl px-3 py-2 select-none",
          "transition-colors",
          isActive
            ? "bg-white text-[#1f3550] shadow-sm ring-1 ring-[#466896]/30"
            : "text-slate-700 hover:bg-[#466896]/10 hover:text-[#223a57]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1.5 rounded-full bg-[#466896]" />
          )}
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
    const navigate = useNavigate();

    const links = [
      { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/patients", label: "Patients", Icon: Users },
      { to: "/agenda", label: "Calendrier", Icon: Calendar },
      { to: "/invoices", label: "Factures", Icon: FileText },
      { to: "/team", label: "Équipe", Icon: Users },
      { to: "/settings", label: "Paramètres", Icon: Settings },
    ];

    const handleSignOut = () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("current_office_id");
      delete axios.defaults.headers.common["Authorization"];
      navigate("/login");
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-[#eff4fb] to-[#e8edf4] border-r border-slate-200 flex flex-col">
          <div className="h-16 px-4 flex items-center border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[#466896] text-white flex items-center justify-center font-bold">
                C
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-[#466896]">CareHub</div>
                <div className="text-xs text-slate-500">Gestion cabinet</div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 py-3">
              <OfficeBadgeMenu />
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {links.map((l) => (
                <SidebarLink key={l.to} {...l} />
              ))}
            </nav>

            <div className="mt-auto border-t border-slate-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#466896]/10 hover:text-[#223a57] transition">
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>
    );
}
