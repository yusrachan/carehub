import { useEffect, useState } from "react";
import { api } from "../../api";
import { useOffice } from "../../context/OfficeContext";

export default function PatientSelect({ value, onChange }) {
    const { currentOffice } = useOffice();
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                setErr("");
                setLoading(true);
                const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;
                const { data } = await api.get("/patients/", { headers });
                if (!mounted) return;
                setPatients(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!mounted) return;
                console.error(e);
                setErr("Impossible de charger les patients.");
                setPatients([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [currentOffice]);

    if (loading) {
        return <div className="text-sm text-gray-500">Chargement des patients…</div>;
    }
    if (err) {
        return <div className="text-sm text-red-600">{err}</div>;
    }

    return (
        <select
        className="w-full border rounded-lg px-3 py-2 bg-white"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}>
            <option value="" disabled>Choisir un patient</option>
            {patients.map((p) => {
                const name = p.full_name || [p.last_name, p.first_name].filter(Boolean).join(" ") || `#${p.id}`;
                return (
                    <option key={p.id} value={p.id}>{name}</option>
                );
            })}
        </select>
    );
}
