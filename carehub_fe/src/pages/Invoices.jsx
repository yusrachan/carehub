// src/pages/Invoices.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Euro, Plus, Eye, Download, CheckCircle2, RotateCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { api } from "../api";

const fmtEUR = (n) =>
    typeof n === "number" ? new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n) : "—";

    const statusBadgeClass = (status) => {
        switch ((status || "").toLowerCase()) {
            case "paid":
            return "bg-emerald-100 text-emerald-800 border border-emerald-200";
            case "pending":
            return "bg-amber-100 text-amber-800 border border-amber-200";
            case "overdue":
            return "bg-rose-100 text-rose-800 border border-rose-200";
            default:
            return "bg-slate-100 text-slate-700 border border-slate-200";
        }
    };

    export default function Invoices() {
        const navigate = useNavigate();
        const [items, setItems] = useState([]);
        const [loading, setLoading] = useState(true);
        const [err, setErr] = useState("");

        async function fetchInvoices() {
            setLoading(true);
            setErr("");
            try {
                const { data } = await api.get("/invoices/");
                const list = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
                setItems(list);
            } catch (e) {
                console.error(e);
                setErr("Impossible de charger les factures.");
            } finally {
                setLoading(false);
            }
        }

        useEffect(() => { fetchInvoices(); }, []);

        async function handleDownload(id, ref) {
            try {
                const { data } = await api.get(`/invoices/${id}/download/`, { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([data]));
                const a = document.createElement("a");
                a.href = url;
                a.download = `${ref || "invoice-" + id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error(e);
                alert("Téléchargement impossible.");
            }
        }

        async function handleMarkPaid(id) {
            try {
                await api.post(`/invoices/${id}/mark-paid/`);
                setItems((prev) => prev.map((it) => (it.id === id ? { ...it, state: "paid", paid_date: new Date().toISOString().slice(0, 10) } : it)));
            } catch (e) {
                console.error(e);
                alert("Échec du passage en 'payée'.");
            }
        }

        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const metrics = useMemo(() => {
            const isSameMonth = (isoDate) => (isoDate || "").startsWith(monthKey);
            const paid = items.filter((i) => i.state === "paid");
            const paidThisMonth = paid.filter((i) => isSameMonth(i.sending_date));
            const sumPaidThisMonth = paidThisMonth.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
            const pending = items.filter((i) => i.state === "pending").length;
            const overdue = items.filter((i) => i.state === "overdue").length;
            return { sumPaidThisMonth, pending, overdue };
        }, [items, monthKey]);

        return (
            <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                    <h1 className="text-3xl font-bold text-gray-900">Facturation</h1>
                    <p className="text-gray-600">Gestion des factures et paiements</p>
                    </div>
                    <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchInvoices} className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4" /> Actualiser
                    </Button>
                    <Button className="bg-[#466896] hover:bg-[#3b587c] flex items-center gap-2" onClick={() => navigate("/invoices/new")}>
                        <Plus className="w-4 h-4" /> Nouvelle facture
                    </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm font-medium text-gray-600">Revenus du mois</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{fmtEUR(metrics.sumPaidThisMonth)}</div>
                            <div className="text-xs text-gray-500">Factures payées sur {now.toLocaleDateString("fr-BE", { month: "long", year: "numeric" })}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{metrics.pending}</div>
                            <div className="text-xs text-gray-500">Factures à encaisser</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-sm font-medium text-gray-600">En retard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">{metrics.overdue}</div>
                            <div className="text-xs text-gray-500">Échéance dépassée</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center">
                            <Euro className="w-5 h-5 mr-2" /> Factures récentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading && <div className="text-sm text-gray-500">Chargement…</div>}
                        {err && (
                            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                            {err}
                            </div>
                        )}
                        {!loading && !items.length && !err && (
                            <div className="text-sm text-gray-600">Aucune facture.</div>
                        )}

                        <div className="divide-y">
                            {items.map((inv) => {
                                const ref = inv.reference_number || `FAC-${inv.id}`;
                                const patient = inv.patient_display || inv.patient || "—";
                                const date = inv.sending_date ? new Date(inv.sending_date).toLocaleDateString("fr-BE") : "—";
                                const amount = fmtEUR(Number(inv.amount) || 0);
                                const nbActs = Array.isArray(inv.agenda) ? inv.agenda.length : (Array.isArray(inv.agenda_details) ? inv.agenda_details.length : 0);

                                return (
                                    <div key={inv.id} className="flex items-center justify-between py-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="font-semibold text-gray-900 truncate">{ref}</div>
                                                <span className="text-xs px-2 py-0.5 rounded-full capitalize {statusBadgeClass(inv.state)}">
                                                    <span className={`${statusBadgeClass(inv.state)} px-2 py-0.5 rounded-full text-xs`}>
                                                        {inv.state || "—"}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 truncate">
                                                {patient} • Émise le {date} • {nbActs} acte{nbActs > 1 ? "s" : ""}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-28 text-right font-semibold">{amount}</div>

                                            {inv.state !== "paid" && (
                                                <Button variant="outline" size="sm" onClick={() => handleMarkPaid(inv.id)} className="flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" /> Payée
                                                </Button>
                                            )}

                                            <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${inv.id}`)}>
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleDownload(inv.id, ref)}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
