import React, { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";

export default function RegisterJoin() {
    const [fields, setFields] = useState(null)
    const [password, setPassword] = useState("")
    const [msg, setMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get("token")
        if(!token) {
            setMsg("Lien d'invitation invalide.")
            return
        }
        fetch(`/api/invitation-detail/?token=${encodeURIComponent(token)}`)
            .then(res => res.json())
            .then(data => {
                if(data.error) setMsg(data.error);
                else setFields({ ...data, token });
            })
            .catch(() => setMsg("Erreur serveur."))
    }, [])

    const acceptExisting = async () => {
    if (!fields) return;
    setLoading(true);
    setMsg("");
    try {
        const res = await fetch("/api/register-join/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: fields.token }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            if (fields.office_id) {
                localStorage.setItem("current_office_id", String(fields.office_id));
            }
            navigate("/dashboard");
        } else {
            setMsg(data.error || "Impossible d'accepter l'invitation.");
        }
        } catch {
            setMsg("Erreur serveur.");
        } finally {
            setLoading(false);
        }
    };

    const createNewAccountAndJoin = async (e) => {
        e.preventDefault();
        if (!fields) return;
        setLoading(true);
        setMsg("");
        try {
            const res = await fetch("/api/register-join/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                token: fields.token,
                password, // Ici on envoie le mdp pour la création
                }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            if (fields.office_id) {
                localStorage.setItem("current_office_id", String(fields.office_id));
            }
            navigate("/dashboard");
        } else {
            setMsg(data.error || "Erreur lors de l'inscription.");
        }
        } catch {
            setMsg("Erreur serveur.");
        } finally {
            setLoading(false);
        }
    };

    if (!fields) {
        return <div className="p-6">{msg ? <p>{msg}</p> : <p>Chargement...</p>}</div>;
    }

    if (fields.user_exists) {
        return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-12 text-center">
            <h2 className="text-xl font-bold mb-2">Invitation</h2>
            <p className="text-gray-700">
            Vous êtes invité(e) à rejoindre <span className="font-medium">{fields.office_name}</span>{" "}
            en tant que <span className="font-medium">{fields.role}</span> avec l'adresse{" "}
            <span className="font-mono">{fields.email}</span>.
            </p>
            <p className="text-gray-600 mt-2">Souhaitez-vous accepter cette invitation ?</p>

            {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}

            <div className="mt-6 flex gap-2">
            <button
                onClick={acceptExisting}
                disabled={loading}
                className={`flex-1 py-2 rounded-lg text-white ${loading ? "bg-gray-400" : "bg-[#466896] hover:opacity-95"}`}>
                {loading ? "Validation…" : "Accepter et rejoindre"}
            </button>
            <a
                href="/login"
                className="flex-1 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center">
                Se connecter avec un autre compte
            </a>
            </div>
        </div>
        );
    }

    return (
        <form onSubmit={createNewAccountAndJoin} className="max-w-md mx-auto p-6 bg-white rounded-xl shadow mt-12">
            <h2 className="text-xl font-bold mb-4">Créer votre compte et rejoindre</h2>
            <div className="mb-2">
                <label className="block text-sm text-gray-700">Cabinet</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={fields.office_name || ""} readOnly />
            </div>
            <div className="mb-2">
                <label className="block text-sm text-gray-700">E-mail</label>
                <input type="email" className="w-full border rounded px-2 py-1" value={fields.email} readOnly />
            </div>
            <div className="mb-2">
                <label className="block text-sm text-gray-700">Prénom</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={fields.name} readOnly />
            </div>
            <div className="mb-4">
                <label className="block text-sm text-gray-700">Nom</label>
                <input type="text" className="w-full border rounded px-2 py-1" value={fields.surname} readOnly />
            </div>
            <div className="mb-4">
                <label className="block text-sm text-gray-700">Mot de passe</label>
                <input
                type="password"
                className="w-full border rounded px-2 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required/>
            </div>
            {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}
            <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 rounded-lg text-white ${loading ? "bg-gray-400" : "bg-[#466896] hover:opacity-95"}`}>
                {loading ? "Création…" : "Créer mon compte et rejoindre"}
            </button>
        </form>
    );
}