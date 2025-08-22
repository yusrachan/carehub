import { useSearchParams } from 'react-router-dom';
import ProfileTab from './tabs/ProfileTab.jsx';
import EmployeesTab from './tabs/EmployeesTab.jsx';
import SubscriptionTab from './tabs/SubscriptionsTab.jsx';

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'profile';

  const setTab = (t) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };

  const tabs = [
    { key: 'profile',      label: 'Profil' },
    { key: 'employees',    label: 'Employés' },
    { key: 'subscription', label: 'Abonnement' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 -mb-px border-b-2 ${
              tab === t.key ? 'border-black font-medium' : 'border-transparent text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'profile' && <ProfileTab />}
        {tab === 'employees' && <EmployeesTab />}
        {tab === 'subscription' && <SubscriptionTab />}
      </div>
    </div>
  );
}
