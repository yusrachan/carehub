import React, { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";

const RegisterJoin = () => {
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
        fetch(`/api/invitation-detail/?token=${token}`)
            .then(res => res.json())
            .then(data => {
                if(data.error) setMsg(data.error);
                else setFields({ ...data, token });
            })
            .catch(() => setMsg("Erreur serveur."))
    }, [])

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        setMsg("")
        try {
            const res = await fetch("/api/register-join/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: fields.token,
                    password,
                }),
            });
            const data = await res.json()
            if (res.ok) {
                setMsg("Inscription réussie !")
                localStorage.setItem("access_token", data.access)
                localStorage.setItem("refresh", data.refresh)
                setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                setMsg(data.error || "Erreur lors de l'inscription.")
            }
        } catch (err) {
            setMsg("Erreur serveur.")
        }
        setLoading(false)
    }

    if(!fields) return <div className="p-6">{msg ? <p>{msg}</p> : <p>Chargement...</p>}</div>

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded-xl shadow mt-12">
            <h2 className="text-xl font-bold mb-4">Création de votre compte</h2>
            <div className="mb-2">
                <label>E-mail</label>
                <input type="email" className="w-full" value={fields.email} readOnly />
            </div>
            <div className="mb-2">
                <label>Prénom</label>
                <input type="text" className="w-full" value={fields.name} readOnly />
            </div>
            <div className="mb-2">
                <label>Nom</label>
                <input type="text" className="w-full" value={fields.surname} readOnly />
            </div>
            <div className="mb-2">
                <label>Rôle</label>
                <input type="text" className="w-full" value={fields.role} readOnly />
            </div>
            <div className="mb-2">
                <label>Mot de passe</label>
                <input
                type="password"
                className="w-full"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
                disabled={loading}
            >
                {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
            {msg && <p className="mt-2 text-center">{msg}</p>}
        </form>
    )
}

export default RegisterJoin