import React from "react";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Calendar, FileText, Shield, Star } from "lucide-react";

export default function LandingPage() {
    return(
        <div className="flex flex-col w-screen min-h-screen bg-[#D9E1E8] text-[#333333]">
            {/* Header */}
            <header className="flex justify-between items-center p-6 shadow-md bg-white">
                <div className="flex items-center space-x-3">
                <img src="/images/logo.png" alt="CareHub Logo" className="w-12 h-12" />
                <h1 className="text-2xl font-bold">CareHub</h1>
                </div>
                <div className="flex space-x-4">
                    <Link to="/login" className="px-6 py-2 text-gray-800 bg-white rounded-xl shadow">
                    Se connecter                
                    </Link>
                    <Link to="/register-choice" className="px-6 py-2 bg-[#466896] text-white rounded-xl shadow">
                    S'inscrire
                    </Link>
                    <Link to="/register-office" className="px-6 py-2 bg-[#466896] text-white rounded-xl shadow">
                    S'inscrire cab
                    </Link>
                </div>
            </header>

            {/* Main Section */}
            <main className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">Gérez votre cabinet de <br />
                    <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        kinésithérapie
                    </span> en toute simplicité
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                CareHub est la solution tout-en-un pour gérer vos patients, rendez-vous et factures, de manière rapide, sécurisée et efficace.
                </p>
                <Link to="/register" className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 px-8 py-6 text-lg rounded-xl">
                Commencer maintenant
                </Link>
            </main>

            <section className="container mx-auto px-4 py-16 text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Tout ce dont vous avez besoin pour votre cabinet</h3>
                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">Gestion des patients</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            Dossiers patients complets, historique des soins, notes de séances et suivi personnalisé
                        </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">
                            Planning intelligent
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            Agenda partagé, prise de rendez-vous en ligne et gestion des créneaux
                        </CardDescription>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">
                            Facturation automatisée
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            Création automatique des factures, suivi des paiements
                        </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                        Tarifs adaptés à chaque cabinet
                    </h3>
                    <p className="text-lg text-gray-600">
                        Choisissez la formule qui correspond à la taille de votre structure
                    </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                        <CardTitle className="text-xl text-gray-900">Petit Cabinet</CardTitle>
                        <CardDescription>1-3 praticiens</CardDescription>
                        <div className="text-3xl font-bold text-blue-600 mt-4">30€/mois</div>
                        </CardHeader>
                    </Card>

                    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-green-50 scale-105">
                        <CardHeader className="text-center">
                        <CardTitle className="text-xl text-gray-900">Moyen Cabinet</CardTitle>
                        <CardDescription>4-10 praticiens</CardDescription>
                        <div className="text-3xl font-bold text-blue-600 mt-4">70€/mois</div>
                        </CardHeader>
                    </Card>

                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                        <CardTitle className="text-xl text-gray-900">Grand Cabinet</CardTitle>
                        <CardDescription>11+ praticiens</CardDescription>
                        <div className="text-3xl font-bold text-blue-600 mt-4">120€/mois</div>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="p-4 bg-white text-center shadow-inner">
                &copy; {new Date().getFullYear()} CareHub. Tous droits réservés.
            </footer>
        </div>
    )
}