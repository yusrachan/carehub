import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  FileText,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  TimerReset,
  Euro,
} from "lucide-react";

const PRICING = [
  { name: "Manager", priceMonthly: 90, popular: true, cta: "Choisir Manager" },
  { name: "Kinésithérapeute", priceMonthly: 60, popular: false, cta: "Choisir Kiné" },
  { name: "Secrétaire", priceMonthly: 30, popular: false, cta: "Choisir Secrétaire" },
];

export default function LandingPage() {

    return (
        <div className="flex flex-col w-screen min-h-screen bg-[#D9E1E8] text-[#333333]">
        <header className="flex justify-between items-center p-6 shadow-md bg-white">
            <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="CareHub Logo" className="w-12 h-12" />
                <h1 className="text-2xl font-bold">CareHub</h1>
            </div>
            <div className="flex space-x-4">
                <Link to="/login" className="px-6 py-2 text-gray-800 bg-white rounded-xl shadow">
                    Se connecter
                </Link>
                <Link to="/register" className="px-6 py-2 bg-[#466896] text-white rounded-xl shadow">
                    S'inscrire
                </Link>
            </div>
        </header>

        <main className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Gérez votre cabinet de <br />
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                kinésithérapie
            </span>{" "}
            en toute simplicité
            </h2>

            <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Planifiez vos séances, terminez le rendez-vous et générez la facture en un clic, avec des
                montants calculés sur base de la nomenclature INAMI.
            </p>

            <div className="flex items-center justify-center gap-3 mb-10">
                <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 px-8 py-4 text-lg rounded-xl">
                    Commencer maintenant
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <div className="rounded-xl bg-white p-4 text-left border">
                    <div className="flex items-center gap-2 font-semibold">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Agenda clair
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Vue jour par praticien, statuts (planifié, terminé, annulé).
                    </p>
                </div>
                <div className="rounded-xl bg-white p-4 text-left border">
                    <div className="flex items-center gap-2 font-semibold">
                        <ReceiptText className="w-5 h-5 text-green-600" />
                        Facturation 1-clic
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Depuis un RDV terminé, générez la facture (FAC-YYYY-####) et téléchargez le PDF.
                    </p>
                </div>
                <div className="rounded-xl bg-white p-4 text-left border">
                    <div className="flex items-center gap-2 font-semibold">
                        <Euro className="w-5 h-5 text-purple-600" />
                        INAMI intégré
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Grille tarifaire importée : honoraires, remboursement, tiers-payant.
                    </p>
                </div>
                <div className="rounded-xl bg-white p-4 text-left border">
                    <div className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        Données sécurisées
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Accès authentifié, rôles praticiens, fichiers factures centralisés.
                    </p>
                </div>
            </div>
        </main>

        <section className="container mx-auto px-4 py-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Tout ce dont vous avez besoin pour votre cabinet
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">Dossiers patients</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            Fiche patient, coordonnées, mutuelle/tiers-payant et historique de factures.
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">Planning intelligent</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            Créneaux par praticien, détection de chevauchements, statuts & actions rapides.
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">Facturation automatisée</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                        <CardDescription className="text-gray-600">
                            Calculs via nomenclature INAMI + PDF. Amende no-show/annulation &lt; 24 h (configurable).
                        </CardDescription>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            FAC-YYYY-#### généré automatiquement
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        <section className="container mx-auto px-4 py-16">
            <div className="rounded-2xl bg-white shadow p-6 md:p-10">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                    Comment ça marche ?
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="border rounded-xl p-4">
                        <div className="font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> 1. Planifier
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Créez le rendez-vous (prescription/annuel), le système vérifie la cohérence et la
                            tarification disponible.
                        </p>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 2. Terminer
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Marquez « Terminé » ou « Annulé ». En cas d’annulation &lt; 24 h, une amende peut être
                            proposée.
                        </p>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="font-semibold flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-purple-600" /> 3. Facturer
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Générez la facture (montants INAMI), téléchargez le PDF et retrouvez-la dans le
                            profil patient.
                        </p>
                    </div>
                </div>
            </div>
        </section>

            <section id="pricing" className="container mx-auto px-4 py-16">
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Tarifs par rôle</h3>
                    <p className="text-lg text-gray-600">Payez uniquement pour les rôles utilisés.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {PRICING.map((p) => (
                        <div
                        key={p.name}
                        className={`rounded-2xl bg-white border shadow-lg p-6 text-center ${
                        p.popular ? "ring-2 ring-[#466896]" : ""
                        }`}>
                            <div className="text-xl font-semibold text-gray-900">{p.name}</div>

                            <div className="text-5xl font-bold text-blue-600 mt-3">
                                {p.priceMonthly}€
                            <span className="text-base font-medium text-gray-700">/mois</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="p-4 bg-white text-center shadow-inner">
                &copy; {new Date().getFullYear()} CareHub. Tous droits réservés.
            </footer>
        </div>
    );
}
