import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000"

export default function NewInvoice() {
    const navigate = useNavigate

    const [search, setSearch] = useState("")
    const [patients, setPatients] = useState([])
    const [loadingPatients, setLoadingPatients] = useState(false)

    const [patientId, setPatientId] = useState("")
    const [appts, setAppts] = useState([])
    const [loadingAppts, setLoadingAppts] = useState(false)

    const [selectedIds, setSelectedIds] = useState([])
    const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10))
    const [notes, setNotes] = useState("")

    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    //Charger les patients
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingAppts(true)
                const url = `${API_BASE}/api/patients/${search ? `?search=${encodeURIComponent(search)}` : ""}`
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`}
                })
                const data = await res.json().catch(() => [])
                if(!res.ok) throw new Error("Impossible de charger les patients.");
                if (alive) setPatients(Array.isArray(data) ? data : [])
            } catch (e) {
                if(alive) setPatients([])
            } finally {
                if (alive) setLoadingPatients(false)
            }
        })
    })

    //Charger les RDV du patient
    useEffect(() => {
        if (!patientId) {
            setAppts([])
            setSelectedIds([])
            return
        }
        let alive = true
        (async () => {
            try {
                setLoadingAppts(true)
                const url = `${API_BASE}/api/agenda/?patient_id=${patientId}&invoicable=true`
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`}
                })
                const data = await res.json().catch(() => [])
                if (!res.ok) throw new Error();
                if (alive) {
                    setAppts(Array.isArray(data) ? data : [])
                    setSelectedIds([])
                }
            } catch {
                if (alive) {
                    setAppts([])
                    setSelectedIds([])
                }
            } finally {
                if (alive) setLoadingAppts(false)
            }
        })()
        return () => { alive = false }
    }, [patientId])

    const total = useMemo(() => {
        const map = new Map(appts.map(a => [a.id, a]))
        return selectedIds
            .map(id => map.get(id))
            .filter(Boolean)
            .reduce((sum, a) => sum + (Number(a.honoraires_total) || 0), 0)
    }, [selectedIds, appts])

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const selectAll = () => setSelectedIds(appts.map(a => a.id))
    const clearAll = () => setSelectedIds([])

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

    const onSubmit = async (e) => {
        e.preventDefault()
        setError("")
        if(!patientId) return setError("Sélectionne un patient");
        if(selectedIds.length === 0) return setError("Sélectionne au moins un rendez-vous.");
        if(!dueDate) return setError("La date d'échéance est requise.");

        setSaving(true)
        try {
            const res = await fetch(`${API_BASE}/api/invoices/create-invoice/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
                body: JSON.stringify({
                    patient_id: Number(patient_id),
                    appointment_ids: selectedIds,
                    due_date: dueDate,
                }),
            })

            const data = await res.json().catch(() => ({}))
            
            if (!res.ok) {
                throw new Error(data.error || "Erreur lors de la création de la facture.");                
            }
            navigate(`/invoices/${data.invoice_id}`)
        } catch (e) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen">
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Nouvelle facture</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-8">
                            <div className="space-y-2">
                                <label className="block text-sm mb-1">Patient</label>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Nom, Prénom"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <select
                                        className="border rounded px-3 py-2 bg-white text-gray-800"
                                        value={patientId}
                                        onChange={(e) => setPatientId(e.target.value)}>
                                            <option value="">{loadingPatients ? "Chargement..." : "Sélectionne un patient"}</option>
                                            {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.surname || p.name || `Patient #${p.id}`}
                                            </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm">Rendez‑vous facturables</label>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={selectAll} disabled={!appts.length}>Tout cocher</Button>
                                        <Button type="button" variant="outline" onClick={clearAll} disabled={!selectedIds.length}>Tout décocher</Button>
                                    </div>
                                </div>

                                <div className="border rounded-lg divide-y bg-white">
                                    {loadingAppts && (
                                        <div className="p-4 text-sm text-gray-500">Chargement des rendez‑vous…</div>
                                    )}
                                    {!loadingAppts && appts.length === 0 && (
                                        <div className="p-4 text-sm text-gray-500">Aucun rendez‑vous facturable pour ce patient.</div>
                                    )}
                                    {appts.map(a => (
                                        <label key={a.id} className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                type="checkbox"
                                                checked={selectedIds.includes(a.id)}
                                                onChange={() => toggleSelect(a.id)}
                                                />
                                                <div>
                                                    <div className="font-medium">
                                                        {a.act_label || "Acte"} — {new Date(a.date).toLocaleDateString("fr-BE")}
                                                    </div>
                                                    <div className="text-xs text-gray-500">ID: {a.id}</div>
                                                </div>
                                            </div>
                                            <div className="font-semibold">
                                                {Number(a.honoraires_total || 0).toFixed(2)}€
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-sm mb-1">Date d’échéance</label>
                                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm mb-1">Notes (optionnel)</label>
                                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Infos complémentaires" />
                                </div>
                                <div className="md:col-span-1 text-right">
                                    <div className="text-sm text-gray-500">Total</div>
                                    <div className="text-2xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <div className="flex justify-end">
                                <Button className="bg-blue-600 hover:bg-blue-700" disabled={saving} type="submit">
                                {saving ? "Création…" : "Créer la facture"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}