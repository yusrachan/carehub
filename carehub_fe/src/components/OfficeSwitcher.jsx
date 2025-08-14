import { useOffice } from '../context/OfficeContext';

export default function OfficeSwitcher() {
  const { offices, currentOffice, setCurrentOffice } = useOffice();

  if (!offices.length) return null;

  return (
    <select
      className="border rounded-xl px-3 py-2"
      value={currentOffice?.id || ''}
      onChange={(e) => {
        const o = offices.find(x => String(x.id) === e.target.value);
        setCurrentOffice(o || null);
      }}
    >
      {offices.map(o => (
        <option key={o.id} value={o.id}>{o.name || o.id}</option>
      ))}
    </select>
  );
}
