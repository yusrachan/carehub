import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, FileText, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import OfficeBadgeMenu from "./OfficeBadgeMenu";

function SidebarLink({ to, label, Icon, collapsed }) {
  return (
    <NavLink to={to} end title={collapsed ? label : undefined} className={({ isActive }) =>
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
          <span className={collapsed ? "hidden" : "truncate"}>{label}</span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 rounded-md bg-slate-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
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
        <aside className={["fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-[#eff4fb] to-[#e8edf4] flex flex-col transition-all duration-200", collapsed ? "w-20" : "w-72",].join(" ")}>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-[#466896] text-white flex items-center justify-center font-bold">
                C
              </div>
              {!collapsed && (
                <div className="leading-tight">
                  <div className="font-semibold text-[#466896]">CareHub</div>
                </div>
              )}
            </div>

            <button onClick={onToggle} aria-label={collapsed ? "Ouvrir la barre latérale" : "Réduire la barre latérale"}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {!collapsed && (
              <div className="px-4 py-3">
                <OfficeBadgeMenu />
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {links.map((l) => (
                <SidebarLink key={l.to} {...l} collapsed={collapsed} />
              ))}
            </nav>

            <div className="mt-auto border-t border-slate-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-[#466896]/10 hover:text-[#223a57] transition">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Déconnexion</span>}
              </button>
            </div>
          </div>
        </aside>
    );
}
