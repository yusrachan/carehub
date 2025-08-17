import { Building2 } from "lucide-react";
import { useOffice } from "../context/OfficeContext";

export default function CurrentOfficeBadge({ className = "" }) {
  const { offices = [], currentOffice, currentOfficeId, loading } = useOffice();
  if (loading) return null;

  const active =
    currentOffice ||
    offices.find(o => String(o.id) === String(currentOfficeId)) ||
    null;

  if (!active) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border text-sm ${className}`}>
      <Building2 className="w-4 h-4" />
      <span className="font-medium">{active.name}</span>
      {active.role && <span className="text-gray-500">• {active.role}</span>}
    </div>
  );
}
