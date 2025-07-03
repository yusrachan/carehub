import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import axios from "axios";

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  
  const activeClass = "text-white bg-[#466896]";
  const linkClass = "block px-4 py-2 rounded-lg hover:bg-[#466896] hover:text-white transition";

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/patients", label: "Patients" },
    { to: "/agenda", label: "Calendrier" },
    { to: "/invoices", label: "Factures" },
  ];

  const handleSignOut = () => {
    console.log("🔒 Déconnexion déclenchée");
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    delete axios.defaults.headers.common["Authorization"]
    navigate("/login")
  }
  
  return (
    <div className="w-64 h-screen bg-[#D9E1E8] p-6 flex flex-col justify-between">
      <div>
        <button
          className="m-4 p-2 text-[#466896] hover:text-[#254a72] focus:outline-none md:hidden" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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

