import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Grid3X3, List, Plus, Search } from "lucide-react";
import { useOffice } from "../context/OfficeContext"
import { useNavigate } from "react-router-dom";

function ViewToggle({ view, setView }) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setView("grid")}
                className={`rounded-lg border px-3 py-2 inline-flex items-center gap-2 ${
                view === "grid" ? "bg-[#466896] text-white border-[#466896]" : "bg-white hover:bg-gray-50"
                }`}>
                    <Grid3X3 className="w-4 h-4" /> Grille
            </button>
            <button
                onClick={() => setView("list")}
                className={`rounded-lg border px-3 py-2 inline-flex items-center gap-2 ${
                view === "list" ? "bg-[#466896] text-white border-[#466896]" : "bg-white hover:bg-gray-50"
                }`}>
                    <List className="w-4 h-4" /> Liste
            </button>
        </div>
    )
}

function AddPatientDialog({ open, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: "",
        surname: "",
        birth_date: "",
        street: "",
        street_number: "",
        zipcode: "",
        city: "",
        telephone: "",
        email: "",
        box: "",
        medical_history: "",
        is_tiers_payant: false,
        status: "active",
    })

    const [saving, setSaving] = useState(false)
    const [err, setErr] = useState("")

    useEffect(() => {
        if (open) {
            setForm({
                name: "",
                surname: "",
                birth_date: "",
                street: "",
                street_number: "",
                zipcode: "",
                city: "",
                telephone: "",
                email: "",
                box: "",
                medical_history: "",
                is_tiers_payant: false,
                status: "active",
            });
            setErr("")
            setSaving(false)
        }
    }, [open])

    if (!open) return null;

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setErr("")
        try {
            await api.post("/patients/", form)
            onCreated?.()
            onClose()
        } catch (e) {
            setErr("Impossible de créer le patient. Vérifiez les champs et réessayez.")
        } finally {
            setSaving(false)
        }
    }

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
                <div className="text-xl font-semibold text-[#466896] mb-4">Nouveau patient</div>

                {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Prénom</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Nom</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.surname}
                                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                                required/>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">E-mail</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Téléphone</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.telephone}
                                onChange={(e) => setForm({ ...form, telephone: e.target.value })}/>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Rue</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.street}
                                onChange={(e) => setForm({ ...form, street: e.target.value })}
                                required/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">N°</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.street_number}
                                onChange={(e) => setForm({ ...form, street_number: e.target.value })}
                                required/>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Boîte</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.box}
                                onChange={(e) => setForm({ ...form, box: e.target.value })}/>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Code postal</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.zipcode}
                                onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                                required/>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm text-gray-700 mb-1">Ville</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                required/>
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm text-gray-700 mb-1">Antécédents médicaux (optionnel)</label>
                        <textarea
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                        rows={3}
                        value={form.medical_history}
                        onChange={(e) => setForm({ ...form, medical_history: e.target.value })}/>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Date de naissance</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg px-3 py-2 bg-white"
                                value={form.birth_date}
                                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}/>
                        </div>
                        <div className="flex items-center gap-2 mt-6 sm:mt-0">
                            <label htmlFor="tiers" className="text-sm text-gray-700">Tiers payant</label>
                            <input
                                id="tiers"
                                type="checkbox"
                                checked={form.is_tiers_payant}
                                onChange={(e) => setForm({ ...form, is_tiers_payant: e.target.checked })}
                                className="w-4 h-4 bg-white"/>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
                            Annuler
                        </button>
                        <button
                        type="submit"
                        disabled={saving}
                        className={`px-4 py-2 rounded-lg text-white ${saving ? "bg-gray-400" : "bg-[#466896] hover:opacity-95"}`}>
                            {saving ? "Création…" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function PatientCard({ p }) {
    const navigate = useNavigate()
    const go = () => navigate(`/patients/${p.id}`)

    return(
        <div 
        className="rounded-xl border p-4 bg-white cursor-pointer hover:shadow-md transition-shadow outline-none focus:ring-2 focus:ring-[#466896]"
        role="button"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && go()}>
            <div className="font-medium">{p.surname} {p.name}</div>
            <div className="text-sm text-gray-600">
                {p.email || "—"} • {p.telephone || "—"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs border ${
                p.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-700 border-gray-200"
                }`}>
                    {p.status === "active" ? "Actif" : "Inactif"}
                </span>
                {p.is_tiers_payant && (
                    <span className="px-2.5 py-1 rounded-full text-xs border bg-amber-50 text-amber-700 border-amber-100">
                        Tiers payant
                    </span>
                )}
            </div>
        </div>
    )
}

export default function Patients() {
    const navigate = useNavigate()
    const { currentOffice } = useOffice()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState("grid")
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [onlyTiers, setOnlyTiers] = useState(false)
    const [openAdd, setOpenAdd] = useState(false)
    const [err, setErr] = useState("")

    const load = useCallback(async () => {
        if (!currentOffice) return;
        setLoading(true)
        setErr("")
        try {
            const params = {}
            if (search.trim()) params.q = search.trim();
            if (status !== "all") params.status = status;
            if (onlyTiers) params.tiers = "true";
            const { data } = await api.get("/patients/", { params })
            setList(Array.isArray(data) ? data : [])
        } catch (e) {
            console.error(e)
            setErr("Impossible de charger les patients.")
            setList([])
        } finally {
            setLoading(false)
        }
    }, [currentOffice, search, status, onlyTiers])

    useEffect(() => { load(); }, [load])

    const filteredCount = list.length

    const body = useMemo(() => {
        if (loading){
            return (
                <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border p-4 animate-pulse">
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-40 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-28 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            );
        }
        if (err) return <div className="p-6 text-red-600">{err}</div>;
        if (!list.length) {
            return (
                <div className="p-10 text-center">
                    <div className="text-lg font-medium mb-1">Aucun patient</div>
                    <p className="text-gray-600 mb-4">Ajoute ton premier patient pour commencer.</p>
                    <button
                        onClick={() => setOpenAdd(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2 hover:opacity-95">
                        <Plus className="w-4 h-4" />
                        Nouveau patient
                    </button>
                </div>
            );
        }

         if (view === "grid") {
            return (
                <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((p) => <PatientCard key={p.id} p={p} />)}
                </div>
            );
        }
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm bg-white rounded-2xl overflow-hidden border">
                    <thead>
                        <tr className="border-b bg-gray-50 text-gray-600">
                        <th className="text-left px-4 py-3">Nom</th>
                        <th className="text-left px-4 py-3">E-mail</th>
                        <th className="text-left px-4 py-3">Téléphone</th>
                        <th className="text-left px-4 py-3">Statut</th>
                        <th className="text-left px-4 py-3">Tiers payant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((p) => (
                            <tr 
                            key={p.id} 
                            role="button"
                            className="border-b last:border-b-0 cursor-pointer hover:shadow-md transition-shadow outline-none focus:ring-2 focus:ring-[#466896]"
                            tabIndex={0}
                            onClick={() => navigate(`/patients/${p.id}`)}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/patients/${p.id}`)}>
                                <td className="px-4 py-3 font-medium">{p.surname} {p.name}</td>
                                <td className="px-4 py-3">{p.email || "—"}</td>
                                <td className="px-4 py-3">{p.telephone || "—"}</td>
                                <td className="px-4 py-3">{p.status === "active" ? "Actif" : "Inactif"}</td>
                                <td className="px-4 py-3">{p.is_tiers_payant ? "Oui" : "Non"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, [loading, err, list, view]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-600">{filteredCount} patient(s)</p>
                </div>
                <button
                onClick={() => setOpenAdd(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2 hover:opacity-95">
                    <Plus className="w-4 h-4" />
                    Nouveau patient
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative md:flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, e-mail, téléphone…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#466896]"/>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded-lg px-3 py-2 bg-white">
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="inactive">Inactifs</option>
                    </select>

                    <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                        <input
                        type="checkbox"
                        className="bg-white"
                        checked={onlyTiers}
                        onChange={(e) => setOnlyTiers(e.target.checked)}/>
                        <span className="text-sm">Tiers payant</span>
                    </label>

                    <ViewToggle view={view} setView={setView} />
                </div>
            </div>

            <div className="rounded-2xl border bg-white">{body}</div>

            <AddPatientDialog
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                onCreated={load}/>
        </div>
    );
}