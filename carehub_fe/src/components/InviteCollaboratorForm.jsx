import React, { useState } from "react";

const InviteCollaboratorForm = ({ officeId, onSuccess }) => {
    const [form, setForm] = useState({
        email: "",
        name: "",
        surname: "",
        role: "practitioner",
    })
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState("")

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        setMsg("")
        try {
            const res = await fetch("/api/invite-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({
                    ...form,
                    office_id: officeId,
                }),
            })
            if (res.ok) {
                setMsg("Invitation envoyée !")
                setForm({ email: "", name: "", surname: "", role: "practitioner" })
                if (onSuccess) onSuccess()
            } else {
                const data = await res.json()
                setMsg(data.error || "Erreur lors de l'envoi.")
            }
        } catch (err) {
            setMsg("Erreur serveur.")
        }
        setLoading(false)
    }

    return(
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white rounded-xl shadow">
            <h2 className="text-xl font-bold mb-4">Inviter un collaborateur</h2>
            <input
                className="w-full mb-2 p-2 border rounded"
                type="email"
                name="email"
                placeholder="E-mail"
                value={form.email}
                onChange={handleChange}
                required/>
            <input
                className="w-full mb-2 p-2 border rounded"
                type="text"
                name="name"
                placeholder="Prénom"
                value={form.name}
                onChange={handleChange}
                required/>
            <input
                className="w-full mb-2 p-2 border rounded"
                type="text"
                name="surname"
                placeholder="Nom"
                value={form.surname}
                onChange={handleChange}
                required/>
            <select
                className="w-full mb-4 p-2 border rounded"
                name="role"
                value={form.role}
                onChange={handleChange}
                required>
                    <option value="practitioner">Praticien</option>
                    <option value="secretary">Secrétaire</option>
                    <option value="manager">Manager</option>
            </select>
            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
                disabled={loading}>
                    {loading ? "Envoi en cours..." : "Envoyer l’invitation"}
            </button>
            {msg && <p className="mt-2 text-center">{msg}</p>}
        </form>
    )
}

export default InviteCollaboratorForm