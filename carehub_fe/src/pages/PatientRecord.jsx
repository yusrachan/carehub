import { useNavigate, useParams } from "react-router-dom"
import { Badge } from "../components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { useOffice } from "../context/OfficeContext"
import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "../api";
import { CreditCard, FileText, Calendar, Stethoscope, User, Heart, Shield, ChevronLeft } from "lucide-react";

function Skeleton({ className = "" }) {
    return <div className={`animate-pulse bg-muted rounded-md ${className}`} />
}

function ErrorBlock({ title, message, onRetry }) {
    return(
        <Card className="border-destructive/40">
            <CardHeader>
                <CardTitle className="text-destructive">{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
                {onRetry && (
                    <button onClick={onRetry} className="px-3 py-2 rounded-md border hover:bg-accent">
                        Réessayer
                    </button>
                )}
            </CardContent>
        </Card>
    )
}

const TABS = [
    { key: "personal", label: "Données personnelles", icon: User },
    { key: "prescription", label: "Prescription", icon: Stethoscope },
    { key: "medical", label: "Bilan médical", icon: Heart },
    { key: "insurance", label: "Mutuelle", icon: Shield },
    { key: "billing", label: "Facturation", icon: CreditCard },
    { key: "notes", label: "Notes et tâches", icon: FileText },
];

function Tabs({ current, onChange }) {
    return (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 border-b p-2">
                {TABS.map(({ key, label, icon: Icon }) => (
                    <button
                    key={key}
                    onClick={() => onChange(key)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm border transition ${
                        current === key ? "bg-[#466896] text-white border-[#466896]" : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}>
                        <Icon className="w-4 h-4" />
                        <span className="truncate">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const PatientRecord = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { currentOffice } = useOffice()

    const [patient, setPatient] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [tab, setTab] = useState("personal")

    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState({})
    const [saving, setSaving] = useState(false)
    const [saveErr, setSaveErr] = useState("")

    const [tasks, setTasks] = useState([])
    const [notes, setNotes] = useState([])

    const fetchPatient = useCallback( async () => {
        if (!id) return;
        try {
            setLoading(true)
            setError(null)
            const res = await api.get(`/patients/${id}/`, {
                headers: currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined,
            })
            setPatient(res.data)
            setDraft(res.data)
        } catch (e) {
            console.error(e)
            const msg = e?.response?.status === 404 ? "Patient introuvable ou non accessible dans ce cabinet." : "Impossible de charger la fiche patient.";
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [id, currentOffice])

    useEffect(() => {
        fetchPatient()
        window.scrollTo({ top: 0, behavior: "smooth" })
    }, [fetchPatient])
    
    const latestNews = useMemo(() => {
        if (!patient) return [];
        const items = [];
        if (patient.nextAppointment) {
            items.push({
                type: "appointment",
                title: "Prochain RDV",
                description: patient.nextAppointment,
                date: String(patient.nextAppointment).slice(0, 10),
                icon: Calendar,
                priority: "low",
            });
        }
        if (typeof patient.sessions === "number" && typeof patient.maxSessions === "number") {
            items.push({
            type: "billing",
            title: "Séances utilisées",
            description: `${patient.sessions}/${patient.maxSessions} séances`,
            date: new Date().toISOString().slice(0, 10),
            icon: CreditCard,
            priority: patient.maxSessions - (patient.sessions || 0) <= 3 ? "high" : "medium",
            });
        }
        return items;
    }, [patient]);

    const remainingBadge = useMemo(() => {
        if (!patient?.sessions || !patient?.maxSessions) return null;
        const left = patient.maxSessions - patient.sessions;
        const cls = left <= 3 ? "bg-red-100 text-red-800 border-red-200" : left <= 6 ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-emerald-100 text-emerald-800 border-emerald-200";
        return <span className={`text-xs px-2 py-1 rounded-full border ${cls}`}>{left} restantes</span>;
    }, [patient]);

    const startEdit = () => {
        setDraft(patient || {})
        setIsEditing(true)
        setSaveErr("")
    }

    const cancelEdit = () => {
        setDraft(patient || {})
        setIsEditing(false)
        setSaveErr("")
    }

    const saveAll = async () => {
        try {
            const payload = {}
            Object.keys(draft).forEach((k) => {
                if (draft[k] !== patient[k]) payload[k] = draft[k];
            })
            if (Object.keys(payload).length === 0) {
                setIsEditing(false)
                setSaving(false)
                return;
            }
            const { data } = await api.patch(`/patients/${patient.id}/`, payload, {
                headers: currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined,
            });
            setPatient(data)
            setDraft(data)
            setIsEditing(false)
        } catch (e) {
            console.error(e)
            setSaveErr("Échec de l'enregistrement. Vérifiez les champs et réessayez.")
        } finally {
            setSaving(false)
        }
    }

    const setStatus = async (newStatus) => {
        if (!patient) return;
        const prev = patient;
        setPatient({ ...patient, status: newStatus });
        try {
            await api.patch(`/patients/${patient.id}/`, { status: newStatus }, {
                headers: currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined,
            });
        } catch (e) {
            setPatient(prev);
        }
    };

    const savePatient = async (partial) => {
        if (!patient) return;
        const merged = { ...patient, ...partial };
        setPatient(merged);
        try {
            await api.patch(`/patients/${patient.id}/`, partial, {
            headers: currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined,
        });
        } catch (e) {
            fetchPatient();
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error || !patient){
        return (
            <div className="p-6 space-y-6">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline">
                    <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <ErrorBlock title="Fiche patient" message={error || "Erreur inconnue"} onRetry={fetchPatient} />
            </div>
        )
    }

    function Section({ title, icon: Icon, children, right }) {
        return (
            <div className="rounded-xl border bg-white">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2 font-semibold">
                        {Icon && <Icon className="w-5 h-5" />}
                        <span>{title}</span>
                    </div>
                    {right}
                </div>
                <div className="p-4">{children}</div>
            </div>
        );
    }

    const Personal = () => (
        <Section title="Données personnelles" icon={User} right={
            <div className="flex items-center gap-2">
                {!isEditing ? (
                    <>
                        <label className="text-sm text-gray-600">Statut</label>
                        <select
                        value={patient.status || "active"}
                        onChange={(e) => setStatus(e.target.value)}
                        className="border rounded-lg px-2 py-1 bg-white">
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="archived">Archivé</option>
                        </select>
                        <button onClick={startEdit} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
                            Modifier
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        {saveErr && <span className="text-sm text-red-600 mr-2">{saveErr}</span>}
                        <button onClick={cancelEdit} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Annuler</button>
                        <button onClick={saveAll} disabled={saving} className={`px-3 py-2 rounded-lg text-white ${saving ? "bg-gray-400" : "bg-[#466896] hover:opacity-95"}`}>
                            {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                )}
                </div>
            }
        >
            {!isEditing ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-gray-500">Nom complet</div>
                        <div className="font-medium">{patient.surname} {patient.name}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Email</div>
                        <div className="font-medium">{patient.email || "—"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Téléphone</div>
                        <div className="font-medium">{patient.telephone || "—"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Date de naissance</div>
                        <div className="font-medium">{patient.birth_date || "—"}</div>
                    </div>
                    <div className="md:col-span-2">
                        <div className="text-gray-500">Adresse</div>
                        <div className="font-medium">
                            {[patient.street, patient.street_number, patient.box].filter(Boolean).join(" ")} {patient.zipcode} {patient.city}
                        </div>
                    </div>
                    {typeof patient.sessions === "number" && typeof patient.maxSessions === "number" && (
                        <div className="md:col-span-2 flex items-center gap-3">
                            <span className="text-gray-500">Séances</span>
                            <span className="font-medium">{patient.sessions}/{patient.maxSessions}</span>
                            {remainingBadge}
                        </div>
                    )}
                </div>
                ) : (
                    <form className="grid md:grid-cols-2 gap-4 text-sm" onSubmit={(e) => { e.preventDefault(); saveAll(); }}>
                        <div>
                            <label className="block text-gray-500 mb-1">Prénom</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Nom</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.surname || ""} onChange={(e) => setDraft({ ...draft, surname: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Email</label>
                            <input type="email" className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Téléphone</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.telephone || ""} onChange={(e) => setDraft({ ...draft, telephone: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Date de naissance</label>
                            <input type="date" className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.birth_date || ""} onChange={(e) => setDraft({ ...draft, birth_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Rue</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.street || ""} onChange={(e) => setDraft({ ...draft, street: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">N°</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.street_number || ""} onChange={(e) => setDraft({ ...draft, street_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Boîte</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.box || ""} onChange={(e) => setDraft({ ...draft, box: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Code postal</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.zipcode || ""} onChange={(e) => setDraft({ ...draft, zipcode: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-gray-500 mb-1">Ville</label>
                            <input className="w-full border rounded-lg px-3 py-2 bg-white" value={draft.city || ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                        </div>
                    </form>
                )
            }
        </Section>
    )

    const Prescription = () => (
        <Section title="Prescriptions médicales" icon={Stethoscope}>
            <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">Gestion simple (placeholder)</div>
                <button className="px-3 py-2 rounded-lg bg-[#466896] text-white">Nouvelle prescription</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Pathologie</th>
                        <th className="text-left px-3 py-2">Séances</th>
                        <th className="text-left px-3 py-2">Médecin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t">
                            <td className="px-3 py-2">—</td>
                            <td className="px-3 py-2">—</td>
                            <td className="px-3 py-2">—</td>
                            <td className="px-3 py-2">—</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Section>
    );

    const Medical = () => (
        <Section title="Bilan médical du patient" icon={Heart}>
            <div className="space-y-3 text-sm">
                <p className="text-gray-600">Historique des douleurs, examens, scores d'évaluation, objectifs, protocole de rééducation.</p>
                <textarea
                className="w-full border rounded-lg p-2 bg-white"
                rows={6}
                placeholder="Notes médicales…"
                defaultValue={patient.medical_history || ""}
                onBlur={(e) => savePatient({ medical_history: e.target.value })}/>
            </div>
        </Section>
    );

    const Insurance = () => (
        <Section title="Mutuelle" icon={Shield} right={
            !isEditing ? null : null
        }>
            {!isEditing ? (
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-gray-500">Mutuelle</div>
                        <div className="font-medium">{patient.insurance_name || "—"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Numéro affilié</div>
                        <div className="font-medium">{patient.insurance_number || "—"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Tiers payant</div>
                        <div className="font-medium">{patient.is_tiers_payant ? "Oui" : "Non"}</div>
                    </div>
                </div>
            ) : (
                <form className="grid md:grid-cols-2 gap-4 text-sm" onSubmit={(e) => { e.preventDefault(); }}>
                    <div>
                        <label className="block text-gray-500 mb-1">Mutuelle</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={draft.insurance_name || ""} onChange={(e) => setDraft({ ...draft, insurance_name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-gray-500 mb-1">Numéro affilié</label>
                        <input className="w-full border rounded-lg px-3 py-2" value={draft.insurance_number || ""} onChange={(e) => setDraft({ ...draft, insurance_number: e.target.value })} />
                    </div>
                    <label className="inline-flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={!!draft.is_tiers_payant} onChange={(e) => setDraft({ ...draft, is_tiers_payant: e.target.checked })} />
                        <span className="text-sm">Tiers payant</span>
                    </label>
                </form>
            )}
        </Section>
    );

    const Billing = () => (
        <Section title="Facturation" icon={CreditCard}>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-gray-500">Méthode préférée</div>
                    <div className="font-medium">{patient.preferred_billing_method || "—"}</div>
                </div>
                <div>
                    <div className="text-gray-500">Dernière facture</div>
                    <div className="font-medium">{patient.last_invoice || "—"}</div>
                </div>
            </div>
            <div className="mt-4">
                <button className="px-3 py-2 rounded-lg bg-[#466896] text-white">Créer une facture</button>
            </div>
        </Section>
    );

    
    const handleStatusChange = async (newStatus) => {
        if (!patient) return;
        const prev = patient
        setPatient({ ...patient, status: newStatus })
        try {
            await api.patch(`/patients/${patient.id}/`, { status: newStatus }, {
                headers: currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined,
            })
        } catch (e) {
            setPatient(prev)
        }
    }

    const NotesTasks = () => (
        <Section title="Notes et tâches" icon={FileText}>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <div className="font-semibold mb-2">Notes</div>
                    <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        const text = String(f.get("note") || "").trim();
                        if (!text) return;
                        setNotes((prev) => [{ id: Date.now(), text }, ...prev]);
                        e.currentTarget.reset();
                    }}
                    className="mb-3">
                        <div className="flex gap-2">
                            <input name="note" className="flex-1 border rounded-lg px-3 py-2 bg-white" placeholder="Ajouter une note" />
                            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Ajouter</button>
                        </div>
                    </form>
                    <ul className="space-y-2">
                        {notes.length === 0 && <li className="text-sm text-gray-600">Aucune note.</li>}
                        {notes.map((n) => (
                            <li key={n.id} className="text-sm p-3 rounded-lg border bg-gray-50 flex items-start justify-between gap-3">
                                <span>{n.text}</span>
                                <button onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))} className="text-xs text-gray-500 hover:underline">
                                    Supprimer
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <div className="font-semibold mb-2">Tâches ({tasks.length})</div>
                    <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        const text = String(f.get("task") || "").trim();
                        if (!text) return;
                        setTasks((prev) => [{ id: Date.now(), text, done: false }, ...prev]);
                        e.currentTarget.reset();
                    }}
                    className="mb-3">
                        <div className="flex gap-2">
                            <input name="task" className="flex-1 border rounded-lg px-3 py-2 bg-white" placeholder="Ajouter une tâche…" />
                            <button className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Ajouter</button>
                        </div>
                    </form>
                    <ul className="space-y-2">
                        {tasks.length === 0 && <li className="text-sm text-gray-600">Aucune tâche.</li>}
                        {tasks.map((t) => (
                            <li key={t.id} className="text-sm p-3 rounded-lg border bg-gray-50 flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2">
                                    <input
                                    type="checkbox"
                                    checked={t.done}
                                    onChange={(e) => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x)))}/>
                                    <span className={t.done ? "line-through text-gray-500" : ""}>{t.text}</span>
                                </label>
                                <button onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))} className="text-xs text-gray-500 hover:underline">
                                    Supprimer
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Section>
    );

    return (
        <div className="p-6 space-y-6">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline">
                <ChevronLeft className="w-4 h-4" /> Retour
            </button>

            <div className="rounded-xl border bg-white p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <div className="text-2xl font-bold">{patient.surname} {patient.name}</div>
                    <div className="text-sm text-gray-600">{patient.email || "—"} • {patient.telephone || "—"}</div>
                </div>
                <div className="flex items-center gap-2">
                    {remainingBadge}
                    {patient.status && (
                        <span className="text-xs px-2 py-1 rounded-full border bg-gray-50 text-gray-800">
                            {patient.status}
                        </span>
                    )}
                </div>
            </div>

            {latestNews.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                    {latestNews.map((n, i) => (
                        <div key={i} className="rounded-xl border bg-white p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold">
                                    {n.icon && <n.icon className="w-5 h-5" />}
                                    <span>{n.title}</span>
                                </div>
                                <span className="text-xs text-gray-500">{n.date}</span>
                            </div>
                            <div className="text-sm text-gray-700 mt-2">{n.description}</div>
                        </div>
                    ))}
                </div>
            )}

            <Tabs current={tab} onChange={setTab} />

            {tab === "personal" && <Personal />}
            {tab === "prescription" && <Prescription />}
            {tab === "medical" && <Medical />}
            {tab === "insurance" && <Insurance />}
            {tab === "billing" && <Billing />}
            {tab === "notes" && <NotesTasks />}
        </div>
    );
}

export default PatientRecord;