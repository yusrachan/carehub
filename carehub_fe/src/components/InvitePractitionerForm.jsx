import { useState } from "react";
import { api } from "../api";

export default function InvitePractitionerForm({ role = "practitioner", officeId, onClose, onSuccess }) {
  const [inami, setInami] = useState("");
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState(null);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const isManager = role === "manager";
  const title = isManager ? "Inviter un manager" : "Inviter un kinésithérapeute";
  const help  = isManager
    ? "Le manager doit disposer d'un numéro INAMI. S'il existe déjà sur CareHub, vous pourrez l'ajouter directement. Sinon, on vous demandera ses informations."
    : "Entrez son numéro INAMI. S'il existe déjà, on vous proposera de l'ajouter. Sinon, on vous demandera ses informations.";

  const handleCheck = async (e) => {
    e.preventDefault();
    setErr("");
    setChecking(true);
    try {
      const { data } = await api.get("/check-inami/", { params: { inami } });
      setExists(!!data.exists);
      if (data.exists && data.user) {
        setName(data.user.name || "");
        setSurname(data.user.surname || "");
        setEmail(data.user.email || "");
      } else {
        setName("");
        setSurname("");
        setEmail("");
      }
    } catch {
      setErr("Impossible de vérifier l'INAMI pour le moment.");
    } finally {
      setChecking(false);
    }
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const payload = { office_id: officeId, role, inami };
      if (exists === false) {
        payload.name = name.trim();
        payload.surname = surname.trim();
        payload.email = email.trim();
      }
      await api.post("/invite-user/", payload);
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setErr(e?.response?.data?.error || "Erreur lors de l’invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600">{help}</p>

      {exists === null && (
        <form onSubmit={handleCheck} className="space-y-3">
          <label className="block text-sm text-gray-600">Numéro INAMI</label>
          <input
            className="w-full border rounded-lg p-2 bg-white"
            value={inami}
            onChange={(e) => setInami(e.target.value.replace(/\D/g, "").slice(0, 11))}
            required
            placeholder="11 chiffres"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-3 py-2 border rounded-lg" onClick={onClose}>Annuler</button>
            <button disabled={checking || !inami} className="px-3 py-2 rounded-lg bg-[#466896] text-white">
              {checking ? "Vérification…" : "Suivant"}
            </button>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </form>
      )}

      {exists === true && (
        <form onSubmit={submitInvite} className="space-y-3">
          <div className="text-sm text-gray-700">
            {isManager ? "Manager trouvé" : "Kinésithérapeute trouvé"} :{" "}
            <strong>{name} {surname}</strong>{email ? ` — ${email}` : ""}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="px-3 py-2 border rounded-lg" onClick={() => setExists(null)}>Retour</button>
            <button disabled={loading} className="px-3 py-2 rounded-lg bg-[#466896] text-white">
              {loading ? "Envoi…" : "Envoyer l’invitation"}
            </button>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </form>
      )}

      {exists === false && (
        <form onSubmit={submitInvite} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600">Prénom</label>
              <input className="w-full border rounded-lg p-2" value={name} onChange={(e)=>setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Nom</label>
              <input className="w-full border rounded-lg p-2" value={surname} onChange={(e)=>setSurname(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600">E-mail</label>
            <input className="w-full border rounded-lg p-2" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" className="px-3 py-2 border rounded-lg" onClick={() => setExists(null)}>Retour</button>
            <button disabled={loading} className="px-3 py-2 rounded-lg bg-[#466896] text-white">
              {loading ? "Envoi…" : "Envoyer l’invitation"}
            </button>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </form>
      )}
    </div>
  );
}
