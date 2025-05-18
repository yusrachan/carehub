import { use, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const activeClass = "text-white bg-[#466896]";
  const linkClass = "block px-4 py-2 rounded-lg hover:bg-[#466896] hover:text-white transition";

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/appointments", label: "Rendez-vous" },
    { to: "/invoices", label: "Factures" },
  ];
  
  return (
    <div className="w-64 h-screen bg-[#D9E1E8] p-6">
      <div className="text-2xl font-bold mb-10 text-[#466896]">CareHub</div>
      <nav className="space-y-4">
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`${linkClass} ${location.pathname === to ? activeClass : "text-[#333333]"}`}>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

