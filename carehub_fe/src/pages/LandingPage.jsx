import React from "react";
import { Link } from 'react-router-dom';

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
                    <Link to="/register" className="px-6 py-2 bg-[#466896] text-white rounded-xl shadow">
                    S'inscrire
                    </Link>
                </div>
            </header>

            {/* Main Section */}
            <main className="flex-grow flex flex-col items-center justify-center text-center px-6">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">La gestion des cabinets simplifiée</h2>
                <p className="text-lg md:text-xl mb-8 max-w-2xl">
                CareHub est la solution tout-en-un pour gérer vos patients, rendez-vous et factures, de manière rapide, sécurisée et efficace.
                </p>
                <Link to="/register" className="px-8 py-3 bg-[#F4A261] text-white text-lg rounded-xl">
                Commencer maintenant
                </Link>
            </main>

            {/* Footer */}
            <footer className="p-4 bg-white text-center shadow-inner">
                &copy; {new Date().getFullYear()} CareHub. Tous droits réservés.
            </footer>
        </div>
    )
}