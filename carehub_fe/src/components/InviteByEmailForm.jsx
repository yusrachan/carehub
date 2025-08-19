import { useEffect, useState } from "react";
import { api } from "../api";

export default function InviteByEmailForm({ role, officeId, onClose, onSuccess }) {
  const [email, setEmail] = useState("");
  const [exists, setExists] = useState(null); // null | true | false
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
        setErr("");
        if (!email) { setExists(null); return; }
        try {
            const { data } = await api.get(`/check-secretary-email/`, { params: { email }});
            if (!alive) return;
            setExists(!!data.exists);
            if (data.exists && data.user) {
            setName(data.user.name || "");
            setSurname(data.user.surname || "");
            }
        } catch {
            if (alive) setExists(null);
        }
        };
        run();
        return () => { alive = false; };
    }, [email]);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const payload = { office_id: officeId, role, email };
            if (!exists) {
                payload.name = name.trim();
                payload.surname = surname.trim();
            }
            await api.post("/invite-user/", payload);
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (e) {
            setErr(e?.response?.data?.error || "Erreur lors de l’invitation.");
        } finally {
            setLoading(false);
        }
    };

  const roleLabel = role === "manager" ? "Manager" : "Secrétaire";

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-xl font-semibold">Inviter un {roleLabel}</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg p-2"/>
      </div>

      {exists === false && (
        <>
          <div className="text-xs text-gray-600">
            Aucun compte trouvé pour cet e-mail. Renseigne le nom et le prénom pour pré-remplir son inscription.
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Prénom</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border rounded-lg p-2"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                required
                value={surname}
                onChange={e => setSurname(e.target.value)}
                className="w-full border rounded-lg p-2"/>
            </div>
          </div>
        </>
      )}

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 border rounded-lg">Annuler</button>
        <button
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-[#466896] text-white">
            {loading ? "Envoi…" : "Envoyer l’invitation"}
        </button>
      </div>
    </form>
  );
}
