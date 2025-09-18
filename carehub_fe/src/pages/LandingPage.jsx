import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  FileText,
  ReceiptText,
  ShieldCheck,
  CheckCircle2,
  Euro,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
    const { t, i18n } = useTranslation();
    
    const PRICING = [
        { name: t("role.manager"), priceMonthly: 90, popular: true, cta: t("pricing.manager") },
        { name: t("role.kine"), priceMonthly: 60, popular: false, cta: t("pricing.kine") },
        { name: t("role.secretary"), priceMonthly: 30, popular: false, cta: t("pricing.secretary") },
    ];

    return (
        <div className="flex flex-col w-screen min-h-screen bg-[#D9E1E8] text-[#333333]">
            <header className="flex justify-between items-center p-6 shadow-md bg-white">
                <div className="flex items-center space-x-3">
                    <img src="/images/logo.png" alt="CareHub Logo" className="w-12 h-12" />
                    <h1 className="text-2xl font-bold">CareHub</h1>
                </div>
                <div className="flex space-x-4">
                    <Link to="/login" className="px-6 py-2 text-gray-800 bg-white rounded-xl shadow">
                        {t("login")}
                    </Link>
                    <Link to="/register" className="px-6 py-2 bg-[#466896] text-white rounded-xl shadow">
                        {t("signup")}
                    </Link>
                    <select
                    onChange={(e) => {
                        const lang = e.target.value;
                        i18n.changeLanguage(lang);
                        localStorage.setItem("lang", lang);
                    }}
                    value={i18n.language}
                    className="px-2 py-1 border rounded bg-white">
                        <option value="fr">FR</option>
                        <option value="nl">NL</option>
                    </select>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t("manage")} <br />
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    {t("physio")}
                </span>{" "}
                {t("simplicity")}
                </h2>

                <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                    {t("landing.description")}
                </p>

                <div className="flex items-center justify-center gap-3 mb-10">
                    <Link
                        to="/register"
                        className="bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-700 hover:to-green-700 px-8 py-4 text-lg rounded-xl">
                        {t("start.now")}
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    <div className="rounded-xl bg-white p-4 text-left border">
                        <div className="flex items-center gap-2 font-semibold">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            {t("agenda")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("agenda.desc")}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 text-left border">
                        <div className="flex items-center gap-2 font-semibold">
                            <ReceiptText className="w-5 h-5 text-green-600" />
                            {t("billing")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("billing.desc")}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 text-left border">
                        <div className="flex items-center gap-2 font-semibold">
                            <Euro className="w-5 h-5 text-purple-600" />
                            {t("inami")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("inami.desc")}
                        </p>
                    </div>
                    <div className="rounded-xl bg-white p-4 text-left border">
                        <div className="flex items-center gap-2 font-semibold">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            {t("secure")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("secure.desc")}
                        </p>
                    </div>
                </div>
            </main>

        <section className="container mx-auto px-4 py-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                {t("features.title")}
            </h3>

            <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">{t("patients")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            {t("patients.desc")}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">{t("planning")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <CardDescription className="text-gray-600">
                            {t("planning.desc")}
                        </CardDescription>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">{t("automation")}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-2">
                        <CardDescription className="text-gray-600">
                            {t("automation.desc")}
                        </CardDescription>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {t("automation.generated")}
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
                            <Calendar className="w-5 h-5 text-blue-600" /> {t("step1.title")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("step1.desc")}
                        </p>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {t("step2.title")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("step2.desc")}
                        </p>
                    </div>
                    <div className="border rounded-xl p-4">
                        <div className="font-semibold flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-purple-600" /> {t("step3.title")}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            {t("step3.desc")}
                        </p>
                    </div>
                </div>
            </div>
        </section>

            <section id="pricing" className="container mx-auto px-4 py-16">
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{t("pricing.title")}</h3>
                    <p className="text-lg text-gray-600">{t("pricing.desc")}</p>
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
                            <span className="text-base font-medium text-gray-700">{t("pricing.month")}</span>
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
