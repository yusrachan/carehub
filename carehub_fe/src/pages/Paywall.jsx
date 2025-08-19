import { useEffect, useState } from "react";
import { api } from "../api";

export default function Paywall() {
    const [url, setUrl] = useState(sessionStorage.getItem("paywall_checkout_url") || "")
    const officeName = sessionStorage.getItem("paywall_office_name") || "Votre cabinet"
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    const startCheckout = async () => {
        setErr("");
        setLoading(true);

        try {
            if (!url){
                const { data } = await api.post("/subscriptions/checkout/start/", {})
                if (data?.checkout_url){
                    sessionStorage.setItem("paywall_checkout_url", data.checkout_url)
                    setUrl(data.checkout_url)
                }
            }
            if (url) window.location.replace(url);
        } catch {
            setErr("Impossible de créer la session de paiement. Réessayez.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!url) startCheckout();
    }, [])

    const handleLogout = async () => {
        try {
        sessionStorage.removeItem("paywall_checkout_url");
        sessionStorage.removeItem("paywall_office_id");
        sessionStorage.removeItem("paywall_office_name");
        sessionStorage.removeItem("paywall_reason");
        sessionStorage.removeItem("paywall_next");

        localStorage.removeItem("current_office_id");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.assign("/login");
        } catch {
        window.location.assign("/login");
        }
    }

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#D9E1E8] p-6">
            <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg text-center">
                <h1 className="text-2xl font-bold text-[#466896]">Abonnement requis</h1>
                <p className="mt-4 text-gray-700">
                    L'abonnement pour <span className="font-medium">{officeName}</span> n'est pas encore actif.
                    Veuillez l'activer pour accéder à la plateforme.
                </p>

                {err && <div className="mt-4 text-red-600 text-sm">{err}</div>}

                <button
                onClick={startCheckout}
                disabled={loading}
                className={`mt-6 w-full py-2 rounded-lg text-white transition ${loading ? "bg-gray-400" : "bg-[#466896] hover:opacity-95"}`}>
                {loading ? "Ouverture du paiement…" : "Activer mon abonnement"}
                </button>

                <button onClick={handleLogout} className="mt-4 w-full py-2 rounded-lg border-gray-300 text-gray-700">
                    Se déconnecter
                </button>
            </div>
        </div>
    );
}