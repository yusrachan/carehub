import React, { useState } from "react";
import { api } from "../api";

export default function InviteSecretaryForm({ officeId, onClose, onSuccess }) {
    const [step, setStep] = useState("check");
    const [email, setEmail] = useState("");
    const [checking, setChecking] = useState(false);
    const [serverErr, setServerErr] = useState("");
    const [existingUser, setExistingUser] = useState(null);

    const [form, setForm] = useState({ name: "", surname: "", email: "" });
    const [submitting, setSubmitting] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        setServerErr("");
        setChecking(true);
        try {
        const { data } = await api.get("/check-secretary-email/", { params: { email } });
        if (data?.exists && data?.user) {
            setExistingUser(data.user);
            setStep("existing");
        } else {
            setForm((f) => ({ ...f, email }));
            setStep("new");
        }
        } catch {
            setServerErr("Impossible de vérifier l'e-mail. Réessaie.");
        } finally {
            setChecking(false);
        }
    };

    const inviteExisting = async () => {
        setServerErr("");
        setSubmitting(true);
        try {
            await api.post("/invite-user/", {
                office_id: officeId,
                role: "secretary",
                email: (existingUser?.email || email).trim(),
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (e) {
            setServerErr(e?.response?.data?.error || "Erreur lors de l'invitation.");
        } finally {
            setSubmitting(false);
        }
    };

    const inviteNew = async (e) => {
        e.preventDefault();
        setServerErr("");
        setSubmitting(true);
        try {
            await api.post("/invite-user/", {
                office_id: officeId,
                role: "secretary",
                email: form.email.trim(),
                name: form.name.trim(),
                surname: form.surname.trim(),
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (e) {
            etServerErr(e?.response?.data?.error || "Erreur lors de l'invitation.");
        } finally {
            setSubmitting(false);
        }
    };

    if (step === "check") {
        return (
        <form onSubmit={handleCheck} className="space-y-4">
            <h3 className="text-lg font-semibold">Inviter une secrétaire</h3>
            <p className="text-sm text-gray-600">
                Entre son e-mail. S’il existe déjà un compte, on te propose de l’inviter directement.
            </p>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full px-3 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-[#466896]"
            required/>
                {serverErr && <div className="text-sm text-red-600">{serverErr}</div>}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border">
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={checking || !email}
                    className="px-3 py-2 rounded-lg bg-[#466896] text-white disabled:opacity-60">
                    {checking ? "Vérification…" : "Suivant"}
                </button>
            </div>
        </form>
        );
    }

    if (step === "existing") {
        return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Compte trouvé</h3>
            <div className="rounded-xl border p-4 bg-gray-50">
            <div className="font-medium">{existingUser?.name} {existingUser?.surname}</div>
            <div className="text-sm text-gray-700">{existingUser?.email}</div>
            </div>

            {serverErr && <div className="text-sm text-red-600">{serverErr}</div>}

            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setStep("check")} className="px-3 py-2 rounded-lg border">
                    Retour
                </button>
                <button
                    onClick={inviteExisting}
                    disabled={submitting}
                    className="px-3 py-2 rounded-lg bg-[#466896] text-white disabled:opacity-60">
                    {submitting ? "Envoi…" : "Envoyer l’invitation"}
                </button>
            </div>
        </div>
        );
    }

    return (
        <form onSubmit={inviteNew} className="space-y-4">
            <h3 className="text-lg font-semibold">Nouvelle collaboratrice</h3>
            <div className="grid sm:grid-cols-2 gap-3">
                <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Prénom"
                className="w-full px-3 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-[#466896]"
                required/>
                <input
                value={form.surname}
                onChange={(e) => setForm((f) => ({ ...f, surname: e.target.value }))}
                placeholder="Nom"
                className="w-full px-3 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-[#466896]"
                required/>
            </div>
            <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="E-mail"
                className="w-full px-3 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-[#466896]"
                required/>

            {serverErr && <div className="text-sm text-red-600">{serverErr}</div>}

            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setStep("check")} className="px-3 py-2 rounded-lg border">
                Retour
                </button>
                <button
                type="submit"
                disabled={submitting}
                className="px-3 py-2 rounded-lg bg-[#466896] text-white disabled:opacity-60">
                {submitting ? "Envoi…" : "Envoyer l'invitation"}
                </button>
            </div>
        </form>
    );
}
