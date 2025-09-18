import { useEffect, useMemo, useState } from 'react';
import { useOffice } from '../../../context/OfficeContext';

export default function EmployeesTab() {
  const { currentOffice, loading } = useOffice();
  const [members, setMembers] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!currentOffice) return;
    fetch(`/api/settings/offices/${currentOffice.id}/members/`, { credentials: 'include' })
      .then(r => r.json()).then(setMembers);
  }, [currentOffice]);

  const filtered = useMemo(() => {
    return members.filter(m =>
      (m.email || '').toLowerCase().includes(q.toLowerCase()) ||
      (m.name || '').toLowerCase().includes(q.toLowerCase()) ||
      (m.surname || '').toLowerCase().includes(q.toLowerCase())
    );
  }, [members, q]);

  const updateRole = (userId, role) => {
    if (!currentOffice) return;
    fetch(`/api/settings/offices/${currentOffice.id}/members/${userId}/role/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role })
    }).then(() => {
      // reload
      return fetch(`/api/settings/offices/${currentOffice.id}/members/`, { credentials: 'include' })
        .then(r => r.json()).then(setMembers);
    });
  };

  const toggleActive = (userId) => {
    if (!currentOffice) return;
    fetch(`/api/settings/offices/${currentOffice.id}/members/${userId}/toggle-active/`, {
      method: 'PATCH',
      credentials: 'include'
    }).then(() => {
      return fetch(`/api/settings/offices/${currentOffice.id}/members/`, { credentials: 'include' })
        .then(r => r.json()).then(setMembers);
    });
  };

  const invite = async () => {
    if (!currentOffice) return;
    const email = prompt('E-mail du nouvel employé :');
    if (!email) return;
    const role = prompt('Rôle (manager/secretary/practitioner) :', 'practitioner');
    await fetch(`/api/settings/offices/${currentOffice.id}/invite/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role })
    });
    const r = await fetch(`/api/settings/offices/${currentOffice.id}/members/`, { credentials: 'include' });
    setMembers(await r.json());
  };

  if (loading) return <div>Chargement…</div>;
  if (!currentOffice) return <div>Aucun cabinet sélectionné.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Rechercher par nom ou e-mail"
          className="border rounded-xl p-2 w-full md:w-80"
        />
        <button onClick={invite} className="px-4 py-2 rounded-xl bg-black text-white">Inviter</button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rôle</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-3">{m.name} {m.surname}</td>
                <td className="p-3">{m.email}</td>
                <td className="p-3">
                  <select
                    defaultValue={m.role}
                    onChange={(e)=>updateRole(m.id, e.target.value)}
                    className="border rounded-lg p-1"
                  >
                    <option value="manager">Manager</option>
                    <option value="secretary">Secrétaire</option>
                    <option value="practitioner">Kinésithérapeute</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full ${m.is_active_in_office ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {m.is_active_in_office ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={()=>toggleActive(m.id)} className="px-3 py-1 rounded-xl border">
                    {m.is_active_in_office ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan="5" className="p-6 text-center text-gray-500">Aucun employé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
