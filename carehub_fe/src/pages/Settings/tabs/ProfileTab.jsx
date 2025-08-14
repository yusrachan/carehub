import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../../api';

export default function ProfileTab() {
  const [me, setMe] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  // Charge le profil une seule fois (avec JWT via http)
  useEffect(() => {
     api.get("/settings/me/") 
      .then(({ data }) => {
        setMe(data);
        reset({
          name: data.name ?? "",
          surname: data.surname ?? "",
          email: data.email ?? "",
        });
      })
      .catch ((e) => {
        console.error('Chargement profil échoué:', e);
      })
  }, [reset]);

  // Enregistrer les infos de profil
  const onSubmit = async (values) => {
    api.patch("/settings/me/", values)
      .then(({ data }) => setMe(data));
  };

  // Changer le mot de passe
  const changePassword = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const { data } = await api.post('/settings/me/change-password/', {
        old_password: form.get('old_password'),
        new_password: form.get('new_password'),
      });
      alert(data.detail || 'Mot de passe modifié.');
      e.currentTarget.reset();
    } catch (err) {
      console.error('Changement MDP échoué:', err);
      alert("Mot de passe actuel incorrect ou token expiré.");
    }
  };

  // Export RGPD
  const exportData = async () => {
    try {
      const { data } = await api.get('/settings/me/export/');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'mes-donnees-carehub.json'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export échoué:', e);
      alert("Impossible d'exporter tes données.");
    }
  };

  // Suppression (soft-delete)
  const requestDeletion = async () => {
    if (!confirm('Confirmer la demande de suppression ?')) return;
    try {
      const { data } = await api.delete('/settings/me/delete/');
      alert(data.detail || 'Demande de suppression enregistrée.');
    } catch (e) {
      console.error('Suppression échouée:', e);
      alert("Impossible d'envoyer la demande.");
    }
  };

  if (!me) return <div>Chargement…</div>;

  return (
    <div className="space-y-8">
      <div className="space-y-4 bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-medium">Informations de profil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Prénom" value={me.name || '—'} />
          <InfoRow label="Nom" value={me.surname || '—'} />
          <div className="md:col-span-2">
            <InfoRow label="Email" value={me.email || '—'} />
          </div>
        </div>
      </div>

      <form onSubmit={changePassword} className="space-y-4 bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-medium">Sécurité</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="old_password" type="password" placeholder="Mot de passe actuel" className="border rounded-xl p-2 bg-white" />
          <input name="new_password" type="password" placeholder="Nouveau mot de passe" className="border rounded-xl p-2 bg-white" />
        </div>
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded-xl border">Changer le mot de passe</button>
        </div>
      </form>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-medium mb-2">Portabilité des données (RGPD)</h2>
        <p className="text-sm text-gray-600 mb-4">Télécharge une copie de tes données liées à ton compte.</p>
        <button onClick={exportData} className="px-4 py-2 rounded-xl border">
          Exporter mes données
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h2 className="text-lg font-medium mb-2">Suppression du compte</h2>
        <p className="text-sm text-gray-600 mb-4">Tu peux demander la suppression (soft-delete) ; un administrateur traitera la demande.</p>
        <button onClick={requestDeletion} className="px-4 py-2 rounded-2xl bg-red-600 text-white">
          Demander la suppression
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}