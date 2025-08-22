import PatientSelect from "../PatientSelect";

export default function DynamicDetailsSection({ eventType, value, onChange, pathologyCategories = [], }) {
    if (!eventType) {
        return <div className="text-sm text-gray-500">Sélectionnez d'abord un type d'événement.</div>;
    }

    if (eventType === "kine-session") {
        const { patientId="", coverage="prescription", prescriptionId="", pathologyCategoryId="" } = value;
        return (
            <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                    <label className="text-sm">
                        <span className="block text-gray-700 mb-1">Patient</span>
                        <PatientSelect
                        value={value.patientId}
                        onChange={(val) => onChange({ patientId: val })}/>
                    </label>

                    <label className="text-sm">
                        <span className="block text-gray-700 mb-1">Couverture</span>
                        <select
                        value={coverage}
                        onChange={(e) => onChange({ coverage: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 bg-white">
                            <option value="prescription">Prescription</option>
                            <option value="annual">Annuel</option>
                        </select>
                    </label>

                    {coverage === "prescription" ? (
                        <label className="text-sm">
                        <span className="block text-gray-700 mb-1">Prescription (ID)</span>
                        <input
                            value={prescriptionId}
                            onChange={(e) => onChange({ prescriptionId: e.target.value })}
                            placeholder="ex: 77"
                            className="w-full border rounded-lg px-3 py-2 bg-white"/>
                        </label>
                    ) : (
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Catégorie pathologie</span>
                            <select
                            value={value.pathologyCategoryId || ""}
                            onChange={(e) => onChange({ pathologyCategoryId: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 bg-white">
                                <option value="" disabled>Choisir une catégorie</option>
                                {(pathologyCategories || []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                    {c.code ? `${c.code} — ${c.label}` : c.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>
        );
    }

    if (eventType === "blocked-slot") {
        const { blockReason="" } = value;
        return (
        <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Raison du blocage</span>
            <input
            value={blockReason}
            onChange={(e) => onChange({ blockReason: e.target.value })}
            placeholder="ex: Pause, déplacement, etc."
            className="w-full border rounded-lg px-3 py-2 bg-white"/>
        </label>
        );
    }

    if (eventType === "meeting") {
        const { meetingTitle="" } = value;
        return (
        <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Intitulé de la réunion</span>
            <input
            value={meetingTitle}
            onChange={(e) => onChange({ meetingTitle: e.target.value })}
            placeholder="ex: Point hebdo"
            className="w-full border rounded-lg px-3 py-2 bg-white"/>
        </label>
        );
    }

    if (eventType === "group-class") {
        const { classType="" } = value;
        return (
        <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Type de cours</span>
            <input
            value={classType}
            onChange={(e) => onChange({ classType: e.target.value })}
            placeholder="ex: Gym dos"
            className="w-full border rounded-lg px-3 py-2 bg-white"/>
        </label>
        );
    }

    const { customTitle="" } = value;

    return (
        <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Titre</span>
            <input
                value={customTitle}
                onChange={(e) => onChange({ customTitle: e.target.value })}
                placeholder="ex: Événement"
                className="w-full border rounded-lg px-3 py-2 bg-white"/>
        </label>
    );
}
