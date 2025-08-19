import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Grid3X3, List, Users, ShieldCheck, Stethoscope } from "lucide-react";
import { api } from "../api";
import InviteMemberDialog from "../components/InviteMemberDialog";
import { useOffice } from "../context/OfficeContext";

function RolePill({ role }) {
    const map = {
        manager: { label: "Manager", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
        practitioner: { label: "Kiné", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        secretary: { label: "Secrétaire", cls: "bg-amber-50 text-amber-700 border-amber-100" },
    }
    const { label, cls } = map[role] || { label: role, cls: "bg-gray-50 text-gray-700 border-gray-200" };
    return <span className={`px-2.5 py-1 rounded-full text-xs border ${cls}`}>{label}</span>;
}

function Avatar({ name = "", surname = "" }) {
    const initials = (name?.[0] || "").toUpperCase() + (surname?.[0] || "").toUpperCase()
    return(
        <div className="w-10 h-10 rounded-full bg-[#466896]/10 flex items-center justify-center font-semibold text-[#466896]">
            {initials || "?"}
        </div>
    )
}

export default function TeamPage({ officeId: officeIdProp, userRole: userRoleProp }) {
    const { currentOffice } = useOffice()
    const officeId = currentOffice?.id ?? officeIdProp ?? null
    const userRole = currentOffice?.role ?? userRoleProp ?? null

    const [members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [view, setView] = useState("grid")
    const [error, setError] = useState("")

    const loadMembers = useCallback(async () => {
        if (!officeId) return
        setLoading(true)
        setError("")
        try {
            const { data } = await api.get(`/offices/${officeId}/members/`)
            setMembers(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error("loadMembers error: ", e)
            setMembers([])
            setError("Impossible de charger l'équipe pour le moment.")
        } finally {
            setLoading(false)
        }
    }, [officeId])

    useEffect(() => {
        loadMembers()
    }, [loadMembers, isAddOpen])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return members
        return members.filter((m) =>
            `${m.name ?? ""} ${m.surname ?? ""} ${m.email ?? ""}`.toLowerCase().includes(q)
        );
    }, [members, search])

    const stats = useMemo(() => {
    const count = (role) => members.filter((m) => m.role === role).length;
    return {
        total: members.length,
        managers: count("manager"),
        practitioners: count("practitioner"),
        secretaries: count("secretary"),
        };
    }, [members]);
  
    const canInvite = userRole === "manager"

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipe</h1>
          <p className="text-gray-600">
            {currentOffice ? (
              <span>Cabinet : <span className="font-medium">{currentOffice.name}</span></span>
            ) : (
              <span>Aucun cabinet sélectionné</span>
            )}
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2 hover:opacity-95">
            <Plus className="w-4 h-4" />
            Ajouter un collaborateur
          </button>
        )}
      </div>

      {/* Barre outils */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative md:flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou e-mail…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("grid")}
            className={`rounded-lg border px-3 py-2 inline-flex items-center gap-2 ${
              view === "grid" ? "bg-[#466896] text-white border-[#466896]" : "bg-white hover:bg-gray-50"
            }`}
            title="Vue grille">
            <Grid3X3 className="w-4 h-4" />
            Grille
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-lg border px-3 py-2 inline-flex items-center gap-2 ${
              view === "list" ? "bg-[#466896] text-white border-[#466896]" : "bg-white hover:bg-gray-50"
            }`}
            title="Vue liste">
            <List className="w-4 h-4" />
            Liste
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" /> Total
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-2xl bg-white border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <ShieldCheck className="w-4 h-4" /> Managers
          </div>
          <div className="text-2xl font-semibold">{stats.managers}</div>
        </div>
        <div className="rounded-2xl bg-white border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Stethoscope className="w-4 h-4" /> Kinés
          </div>
          <div className="text-2xl font-semibold">{stats.practitioners}</div>
        </div>
        <div className="rounded-2xl bg-white border p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" /> Secrétaires
          </div>
          <div className="text-2xl font-semibold">{stats.secretaries}</div>
        </div>
      </div>

      {/* Contenu */}
      <div className="rounded-2xl border bg-white">
        {/* Loading / Error / Empty */}
        {loading ? (
          <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-40 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-28 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-lg font-medium mb-1">Aucun membre</div>
            <p className="text-gray-600 mb-4">Ajoute ton premier collaborateur pour commencer.</p>
            {canInvite && (
              <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2 hover:opacity-95">
                <Plus className="w-4 h-4" />
                Ajouter un collaborateur
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <div key={m.email} className="rounded-xl border p-4 flex gap-3 items-center">
                <Avatar name={m.name} surname={m.surname} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{m.name} {m.surname}</div>
                  <div className="text-sm text-gray-600 truncate">{m.email}</div>
                  <div className="mt-1"><RolePill role={m.role} /></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-600">
                  <th className="text-left px-4 py-3">Membre</th>
                  <th className="text-left px-4 py-3">E-mail</th>
                  <th className="text-left px-4 py-3">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.email} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} surname={m.surname} />
                        <span className="font-medium">{m.name} {m.surname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{m.email}</td>
                    <td className="px-4 py-3"><RolePill role={m.role} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d’invitation */}
      {isAddOpen && (
        <InviteMemberDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          officeId={officeId}
          onAdded={loadMembers}
        />
      )}
    </div>
    )
}