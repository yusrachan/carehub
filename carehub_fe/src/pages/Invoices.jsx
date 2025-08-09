import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Euro, Plus, Badge, Eye, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useNavigate } from "react-router-dom";

const DUMMY_INVOICES = [
  {
    id: "INV-001",
    patient: "Dupont Camille",
    nomenclature: "Rééducation 560010",
    date: "2025-07-14",
    amount: 70.00,
    status: "paid",
  },
  {
    id: "INV-002",
    patient: "Martin Hugo",
    nomenclature: "Drainage lymphatique 571012",
    date: "2025-07-11",
    amount: 35.00,
    status: "pending",
  },
  {
    id: "INV-003",
    patient: "Leroy Sarah",
    nomenclature: "Première séance 560011",
    date: "2025-07-09",
    amount: 85.20,
    status: "overdue",
  },
];

function getStatusBadge(status) {
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

export default function Invoices() {
    const [invoices] = useState(DUMMY_INVOICES)
    const navigate = useNavigate

    const handleNewInvoice = () => {
        navigate("/invoices/new")
    }
    const handleViewInvoice = (invoiceId) => {
        navigate(`/invoices/${invoiceId}`)
    }
    const handleDownloandInvoice = (invoiceId) => {
        fetch(`/api/invoices/${invoiceId}/download`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}`}
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url;
                a.download = `${invoiceId}.pdf`
                a.click()
                a.remove()
            })
            .catch(err => console.error("Erreur téléchargement: ", err))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br via-white to-green-50">
            <main className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Facturation</h1>
                        <p className="text-gray-600">Gestion des factures et nomenclatures INAMI</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 flex items-center" onClick={handleNewInvoice}>
                        <Plus className="w-4 h-4 mr-2"/>
                        Nouvelle facture
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Revenus du mois
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600">
                                Factures en attente
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Euro className="w-5 h-5 mr-2"/>
                                Factures récentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {invoices.map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {invoice.id}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{invoice.patient}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{invoice.nomenclature}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(invoice.date).toLocaleDateString("fr-BE")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    €{invoice.amount.toFixed(2)}
                                                </p>
                                                <Badge className={getStatusBadge(invoice.status)}>
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleViewInvoice(invoice.id)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDownloandInvoice(invoice.id)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}