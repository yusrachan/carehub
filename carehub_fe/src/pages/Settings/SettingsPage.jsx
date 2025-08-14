import { useState } from 'react';
import ProfileTab from './tabs/ProfileTab.jsx';
import EmployeesTab from './tabs/EmployeesTab.jsx';

export default function SettingsPage() {
  const [active, setActive] = useState('profile');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Paramètres</h1>

      <div className="flex gap-2 border-b pb-2 mb-6">
        <button
          onClick={() => setActive('profile')}
          className={`px-4 py-2 rounded-2xl ${active==='profile' ? 'bg-gray-200' : ''}`}>
          Mon profil
        </button>
        <button
          onClick={() => setActive('employees')}
          className={`px-4 py-2 rounded-2xl ${active==='employees' ? 'bg-gray-200' : ''}`}>
          Employés du cabinet
        </button>
      </div>

      {active === 'profile' ? <ProfileTab /> : <EmployeesTab />}
    </div>
  );
}
