import React, { useState } from "react";
import { UserCog, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

const API_BASE = "http://localhost:8000"

const ROLE_CONFIG = {
    practitioner: {
        label: "Kinésithérapeute",
        description: "Ajouter un kinésithérapeute par numéro INAMI.",
        icon: <UserCog className="w-10 h-10 mx-auto text-primary mb-2" />,
        identifierLabel: "Numéro INAMI",
        identifierType: "inami",
        placeholder: "Numéro INAMI",
        checkEndpoint: API_BASE + "/api/check-inami/",
        inviteExistingEndpoint: API_BASE + "/api/invite-existing-user/",
        inviteNewEndpoint: API_BASE + "/api/invite-user/",
        identifierInputType: "text",
    },
    secretary: {
        label: "Secrétaire",
        description: "Ajouter une secrétaire par adresse e-mail.",
        icon: <Users className="w-10 h-10 mx-auto text-primary mb-2" />,
        identifierLabel: "Adresse e-mail",
        identifierType: "email",
        placeholder: "exemple@mail.com",
        checkEndpoint: API_BASE + "/api/check-secretary-email/",
        inviteExistingEndpoint: API_BASE + "/api/invite-existing-secretary/",
        inviteNewEndpoint: API_BASE + "/api/invite-secretary/",
        identifierInputType: "email",
    },
};

export default function AddCollaborator({ officeId, isOpen, onSuccess, onClose }) {
    const [step, setStep] = useState(0)
    const [role, setRole] = useState(null)
    const [identifier, setIdentifier] = useState("")
    const [exists, setExists] = useState(false)
    const [existingUser, setExistingUser] = useState(null)
    const [form, setForm] = useState({ name: "", surname: "", email: "", inami: "", role: ""})
    const [msg, setMsg] = useState("")

    React.useEffect(() => {
        if(!isOpen){
            setStep(0)
            setRole(null)
            setIdentifier("")
            setForm({ name: "", surname: "", email: "", inami: "" })
            setExists(false)
            setExistingUser(null)
            setMsg("")
        }
    }, [isOpen])

    const handleCheckIdentifier = async (e) => {
        e.preventDefault()
        setMsg("")
        const config = ROLE_CONFIG[role]
        let url = config.checkEndpoint + "?"
        url += config.identifierType + "=" + encodeURIComponent(identifier.trim())
        const res = await fetch(url, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("access_token")}` }
        })
        const data = await res.json()
        if (data.exists) {
            setExists(true)
            setExistingUser(data.user)
            setStep(2)
        } else {
            setExists(false)
            if (role === "practitioner") {
                setForm({ ...form, inami: identifier, email: "" })
            } else {
                setForm({ ...form, email: identifier, inami: "" })
            }
            setStep(3)
        }
    }

    const handleInviteExisting = async () => {
        setMsg("")
        const config = ROLE_CONFIG[role]
        const payload = {
            office_id: officeId,
            role,
            [config.identifierType]: identifier.trim(),
        }

        const token = localStorage.getItem("access_token");
        console.log("Token JWT utilisé pour l'invitation :", token);

        const res = await fetch(config.inviteExistingEndpoint, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
            },
            body: JSON.stringify(payload),
        })
        if (res.ok) {
            setMsg("Invitation envoyée !")
            setTimeout(() => {
                setMsg("")
                onSuccess?.()
                onClose?.()
            }, 1000)
        } else {
            const data = await res.json();
            setMsg(data.error || "Erreur lors de l'invitation.");
        }
    }

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })
    const handleInviteNew = async (e) => {
        e.preventDefault()
        console.log("handleInviteNew déclenché !");
        setMsg("")
        const config = ROLE_CONFIG[role]
        const payload = { 
            ...form, 
            office_id: officeId,
            role,
            [config.identifierType]: identifier.trim(),
        }
        const res = await fetch("http://localhost:8000/api/invite-user/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify(payload)
        })
        if (res.ok) {
            setMsg("Invitation envoyée !")
            setTimeout(() => {
                setMsg("")
                onSuccess?.()
                onClose?.()
            }, 1000)
        } else {
            const data = await res.json()
            setMsg(data.error || "Erreur lors de l'invitation.")
        }
    }

    const config = role ? ROLE_CONFIG[role] : null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2x1">
                {step === 0 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-center">Inviter un collaborateur</h2>
                            <p className="text-gray-600 text-center mt-2">
                                Choisissez le type de collaborateur à inviter dans votre cabinet
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {Object.entries(ROLE_CONFIG).map(([key, r]) => (
                                <div
                                key={key}
                                className="bg-white cursor-pointer border-2 rounded-xl p-4 hover:shadow-lg transition-shadow hover:border-blue-600"
                                onClick={() => { setRole(key); setStep(1); }}
                                >
                                <div className="flex flex-col items-center">
                                    {r.icon}
                                    <span className="font-semibold text-lg mt-1">{r.label}</span>
                                </div>
                                <p className="text-sm text-gray-600 text-center mt-2">{r.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center">
                            <Button variant="outline" onClick={onClose}>Annuler</Button>
                        </div>
                    </div>
                )}
                {step === 1 && (
                    <form onSubmit={handleCheckIdentifier}>
                        <h2 className="text-xl font-semibold mb-4 text-center">Inviter un {config.label.toLowerCase()}</h2>
                        <label className="block mb-2 font-medium">{config.identifierLabel}</label>
                        <input
                            className="w-full bg-white text-gray-800 mb-4 p-2 border rounded"
                            type={config.identifierInputType}
                            placeholder={config.placeholder}
                            value={identifier}
                            onChange={e => setIdentifier(e.target.value)}
                            required/>
                        <Button type="submit" className="bg-blue-600 w-full">Suivant</Button>
                        <Button variant="outline" className="w-full mt-2" onClick={onClose}>Annuler</Button>
                        {msg && <p className="mt-2 text-center text-red-500">{msg}</p>}
                    </form>
                )}

                {step === 2 && exists && (
                    <div>
                        <p className="mb-4 text-green-700 font-medium text-center">
                            Cet utilisateur existe déjà sur CareHub !<br />
                            <span>
                                {existingUser.name} {existingUser.surname} ({existingUser.email})
                            </span>
                        </p>
                        <Button className="bg-green-600 w-full" onClick={handleInviteExisting}>
                            Inviter dans le cabinet
                        </Button>
                        <Button variant="outline" className="w-full mt-2" onClick={onClose}>Annuler</Button>
                        {msg && <p className="mt-2 text-center text-green-600">{msg}</p>}
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleInviteNew}>
                        <h2 className="text-xl font-semibold mb-4 text-center">
                            {role === "practitioner" ? "Ajouter un nouveau praticien" : "Ajouter une nouvelle secrétaire"}
                        </h2>
                        <label className="block mb-2 font-medium">Nom</label>
                        <input className="w-full mb-2 p-2 border rounded bg-white text-gray-800" name="name" value={form.name} onChange={handleChange} required />
                        <label className="block mb-2 font-medium">Prénom</label>
                        <input className="w-full mb-2 p-2 border rounded bg-white text-gray-800" name="surname" value={form.surname} onChange={handleChange} required />
                        <label className="block mb-2 font-medium">Email</label>
                        <input className="w-full mb-2 p-2 border rounded bg-white text-gray-800" name="email" value={form.email} onChange={handleChange} type="email" required />
                        {role === "practitioner" && (
                            <>
                                <label className="block mb-2 font-medium">Numéro INAMI</label>
                                <input className="w-full mb-2 p-2 border rounded bg-white text-gray-800" name="inami" value={form.inami} onChange={handleChange} required />
                            </>
                        )}
                        <Button type="submit" className="bg-blue-600 w-full">Inviter</Button>
                        <Button variant="outline" className="w-full mt-2" onClick={onClose}>Annuler</Button>
                        {msg && <p className="mt-2 text-center text-green-600">{msg}</p>}
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )

}