import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Plus, Search, Grid3X3, List, Users, ShieldCheck, Stethoscope, BadgeCheck, Repeat2, Trash2 } from "lucide-react";
import { api, archiveOffice, revokeRole, unarchiveOffice, grantRole } from "../api";
import InviteMemberDialog from "../components/InviteMemberDialog";
import ConfirmActionModal from "../components/ConfirmActionModal";
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

    const [officeInfo, setOfficeInfo] = useState(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState(null)

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

    const loadOfficeInfo = useCallback(async () => {
      if (!officeId) return
      try {
        const { data } = await api.get(`/offices/${officeId}/`)
        setOfficeInfo(data || null)
      } catch (e) {
        setOfficeInfo(null)
      }
    }, [officeId])

    useEffect(() => {
        loadMembers()
        loadOfficeInfo()
    }, [loadMembers, loadOfficeInfo, isAddOpen])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return members
        return members.filter((m) =>
            `${m.name ?? ""} ${m.surname ?? ""} ${m.email ?? ""}`.toLowerCase().includes(q)
        )
    }, [members, search])

    const stats = useMemo(() => {
    const count = (role) => members.filter((m) => m.role === role).length
    return {
        total: members.length,
        managers: count("manager"),
        practitioners: count("practitioner"),
        secretaries: count("secretary"),
        }
    }, [members]);
  
    const canManage = userRole === "manager"

    const askRevokeFromOffice = (member) => {
      if (!canManage) return
      setPendingAction({
        type: "revoke",
        payload: { userId: member.id, officeId, role: member.role, label: `${member.name} ${member.surname}` },
      })
      setConfirmOpen(true)
    }

    const askChangeRole = (member, newRole) => {
      if (!canManage || newRole === member.role) return
      setPendingAction({
        type: "change_role",
        payload: { userId: member.id, officeId, oldRole: member.role, newRole, label: `${member.name} ${member.surname}` },
      })
      setConfirmOpen(true)
    }

    const askToggleArchive = () => {
      if (!canManage) return
      setPendingAction({
        type: officeInfo?.is_archived ? "unarchive_office" : "archive_office",
        payload: { officeId, label: currentOffice?.name || `Cabinet #${officeId}` },
      })
      setConfirmOpen(true)
    }

    const runPending = async (reason) => {
      if (!pendingAction) return
      try {
        const t = pendingAction.type
        const p = pendingAction.payload

        if (t === "revoke"){
          await revokeRole({ userId: p.userId, officeId: p.officeId, role: p.role, reason })
          await loadMembers()
        } else if (t === "change_role") {
          await revokeRole({ userId: p.userId, officeId: p.officeId, role: p.oldRole, reason: `(changement de rôle) ${reason || ""}`.trim() })
          await grantRole({ userId: p.userId, officeId: p.officeId, role: p.newRole, reason })
          await loadMembers()
        } else if (t === "archive_office") {
          await archiveOffice(p.officeId, reason)
          await loadOfficeInfo()
        } else if (t === "unarchive_office") {
          await unarchiveOffice(p.officeId, reason)
          await loadOfficeInfo()
        }
      } catch (e) {
        console.error("Action échouée: ", e)
        alert("Action impossible (droits, état déjà appliqué ou erreur serveur)")
      } finally {
        setConfirmOpen(false)
        setPendingAction(null)
      }
    }

    return (
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Équipe</h1>
              <p className="text-gray-600">
                {currentOffice ? (
                  <span>
                    Cabinet : <span className="font-medium">{currentOffice.name}</span>
                    {officeInfo?.is_archived && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">Archivé</span>}
                  </span>
                ) : (
                  <span>Aucun cabinet sélectionné</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {canManage && (
                <button
                onClick={() => setIsAddOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2 hover:opacity-95"
                disabled={!!officeInfo?.is_archived}
                title={officeInfo?.is_archived ? "Cabinet archivé : ajout désactivé" : undefined}>
                  <Plus className="w-4 h-4" />
                  Ajouter un collaborateur
                </button>
              )}
              
              {canManage && (
                <button
                onClick={askToggleArchive}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2">
                  {officeInfo?.is_archived ? (
                    <>
                      <BadgeCheck className="w-4 h-4" /> Désarchiver
                    </>
                  ) : (
                    <>
                      <Repeat2 className="w-4 h-4"/> Archiver le cabinet
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Barre outils */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative md:flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom ou e-mail"
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
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
                {canManage && !officeInfo?.is_archived && (
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

                      {canManage && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                          onClick={() => askRevokeFromOffice(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm"
                          title="Retirer du cabinet">
                            <Trash2 className="w-4 h-4"/> Retirer
                          </button>

                          <select
                          defaultValue={m.role}
                          onChange={(e) => askChangeRole(m, e.target.value)}
                          className="px-2 py-1.5 rounded-lg border text-sm bg-white"
                          disabled={!!officeInfo?.is_archived}
                          title={officeInfo?.is_archived ? "Cabinet archivé : modification des rôles désactivée" : "Changer de rôle"}>
                            <option value="manager">Manager</option>
                            <option value="practitioner">Kiné</option>
                            <option value="secretary">Secrétaire</option>
                          </select>
                        </div>
                      )}
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
                      {canManage && <th className="text-right px-4 py-3">Actions</th>}
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
                        {canManage && (
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                              onClick={() => askRevokeFromOffice(m)}
                              className="px-3 py-1.5 rounded-lg border">
                                Retirer
                              </button>
                              <select
                              defaultValue={m.role}
                              onChange={(e) => askChangeRole(m, e.target.value)}
                              className="px-2 py-1.5 rounded-lg border bg-white"
                              disabled={!!officeInfo?.is_archived}>
                                <option value="manager">Manager</option>
                                <option value="practitioner">Kiné</option>
                                <option value="secretary">Secrétaire</option>
                              </select>
                            </div>
                          </td>
                        )}
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
            onSuccess={loadMembers}/>
          )}

          {/* Modal de confirmation */}
          {confirmOpen && (
            <ConfirmActionModal
            open
            onClose={() => { setConfirmOpen(false); setPendingAction(null); }}
            title={
              pendingAction?.type === "revoke" ? `Retirer ${pendingAction?.payload?.label} du cabinet`
              : pendingAction?.type === "change_role" ? `Changer le rôle de ${pendingAction?.payload?.label}`
              : pendingAction?.type === "archive_office" ? `Archiver le cabinet ${pendingAction?.payload?.label}`
              : pendingAction?.type === "unarchive_office" ? `Désarchiver le cabinet ${pendingAction?.payload?.label}`
              : "Confirmer l'action"
            }
            description={
              pendingAction?.type?.includes("office")
                ? "Cette action n'efface aucune donnée. Le cabinet passe en lecture seule ; vous pourrez le désarchiver plus tard."
                : "L'action sera journalisée (conformité RGPD / traçabilité)."
            }
            confirmLabel={
              pendingAction?.type === "revoke" ? "Retirer"
              : pendingAction?.type === "change_role" ? "Changer le rôle"
              : pendingAction?.type === "archive_office" ? "Archiver"
              : pendingAction?.type === "unarchive_office" ? "Désarchiver"
              : "Confirmer"
            }
            onConfirm={runPending}/>
          )}
      </div>
  )
}