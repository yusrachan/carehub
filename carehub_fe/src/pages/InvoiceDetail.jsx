import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

export default function InvoiceDetail() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;

        async function fetchInvoice() {
        try {
            setLoading(true);
            setErr("");
            const { data } = await api.get(`/invoices/${id}/`);
            if (alive) setInvoice(data);
        } catch (e) {
            console.error(e);
            if (alive) setErr("Impossible de charger la facture.");
        } finally {
            if (alive) setLoading(false);
        }
        }

        fetchInvoice();
        return () => { alive = false; };
    }, [id]);

    async function markPaid() {
        try {
        await api.post(`/invoices/${id}/mark-paid/`);
        setInvoice((prev) => prev ? { ...prev, state: "paid", paid_date: new Date().toISOString().slice(0,10) } : prev);
        } catch (e) {
        console.error(e);
        alert("Échec du marquage payé.");
        }
    }

    function downloadPdf() {
        window.open(`/api/invoices/${id}/download/`, "_blank");
    }

    if (loading) return <div className="p-4 text-sm text-gray-600">Chargement…</div>;
    if (err) return <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{err}</div>;
    if (!invoice) return null;

    return (
        <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Facture {invoice.reference_number}</h1>
            <Link to="/invoices" className="text-sm underline">← Retour</Link>
        </div>

        <div className="rounded-xl border bg-white p-4 space-y-2">
            <div><span className="text-gray-600">Montant :</span> <span className="font-semibold">{Number(invoice.amount).toFixed(2)} €</span></div>
            <div><span className="text-gray-600">État :</span> <span className="font-semibold capitalize">{invoice.state}</span></div>
            <div><span className="text-gray-600">Émise le :</span> {invoice.sending_date}</div>
            <div><span className="text-gray-600">Échéance :</span> {invoice.due_date}</div>
            {invoice.paid_date && <div><span className="text-gray-600">Payée le :</span> {invoice.paid_date}</div>}
        </div>

        <div className="flex gap-2">
            {invoice.state !== "paid" && (
            <button onClick={markPaid} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                Marquer payé
            </button>
            )}
            <button onClick={downloadPdf} className="px-3 py-2 rounded-lg border hover:bg-gray-50">
            Télécharger le PDF
            </button>
        </div>
        </div>
    );
}
