import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Badge, Download, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:8000"

function statusBadgeClass(status) {
    switch (status) {
        case "paid":
            return "bg-green-200 text-green-800";
        case "pending":
            return "bg-orange-200 text-orange-800";
        case "overdue":
            return "bg-blue-200 text-blue-800";    
        default:
            return "bg-gray-200 text-gray-800";
    }
}

export default function InvoiceDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState("")

    useEffect(() => {
        let alive = true
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/invoices/${id}/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`},
                })
                const data = await res.json().catch(() => ({}))
                
                if (!res.ok) throw new Error("Impossible de récupérer la facture.");
                if (alive) setInvoice(data)                
                } catch (e) {
            setMsg(e.message)
        } finally {
            if (alive) setLoading(false)
            }
        })()
        return () => { alive = false; }
    }, [id])

    const markPaid = async () => {
        setMsg("")
        const res = await fetch(`${API_BASE}/api/invoices/${id}/mark-paid/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
        });
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error("Échec de la mise à jour.");
        setInvoice((inv) => ({ ...inv, state: "paid", paid_date: new Date().toISOString.slice(0,10) }));
        setMsg("Facture marquée payée.");
    };

    const downloadPdf = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/invoices/${id}/download/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
            });
            if (!res.ok) throw new Error("Téléchargement impossible.");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${invoice?.reference_number || `invoice-${id}`}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setMsg(e.message);
        }
    };

    if (loading) {
        return <div className="p-6">Chargement…</div>;
    }

    if (!invoice) {
        return (
        <div className="p-6">
            <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <p className="text-red-600">{msg || "Facture introuvable."}</p>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={downloadPdf}>
                        <Download className="w-4 h-4 mr-2" /> Télécharger PDF
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={markPaid}>
                            <CheckCircle2 className="w-4 h-4 mr-2"/> Marquer payée
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Détail facture {invoice.reference_number}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {msg && <p className="text-sm text-blue-700">{msg}</p>}

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Patient</p>
                                <p className="font-medium">{invoice.patient}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">État</p>
                                <Badge className="{badgeClass(invoice.state)}">{invoice.state}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Montant</p>
                                <p className="font-medium">{Number(invoice.amount).toFixed(2)}€</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Émise le</p>
                                <p className="font-medium">{invoice.sending_date}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Échéance</p>
                                <p className="font-medium">{invoice.due_date}</p>
                            </div>
                            {invoice.paid_date && (
                                <div>
                                    <p className="text-sm text-gray-500">Payée le</p>
                                    <p className="font-medium">€{invoice.paid_date}</p>
                                </div>
                            )}
                            {invoice.description && (
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="font-medium">{invoice.description}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}