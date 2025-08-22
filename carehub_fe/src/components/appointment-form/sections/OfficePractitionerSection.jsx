export default function OfficePractitionerSection({ practitioners, office, value, onChange }) {
    const practitionerId = value.practitionerId || "";
    const place = value.place || "office";

    const officeName =
        (office && (office.name || office.display_name || office.title)) || "—";

    return (
        <div className="space-y-5">
            <label className="block text-sm">
                <span className="block text-gray-700 mb-1">Thérapeute</span>
                <select
                value={practitionerId}
                onChange={(e) => onChange({ practitionerId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white">
                    {practitioners.length === 0 && (
                        <option value="" disabled>
                            Aucun thérapeute disponible
                        </option>
                    )}
                    {practitioners.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name || p.full_name || `#${p.id}`}
                        </option>
                    ))}
                </select>
            </label>

            <div className="block text-sm">
                <div className="block text-gray-700 mb-1">Lieu</div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 p-3 border rounded-lg bg-white cursor-pointer hover:bg-gray-50">
                        <input
                        type="radio"
                        name="place"
                        value="office"
                        className="mt-1"
                        checked={place === "office"}
                        onChange={() => onChange({ place: "office" })}/>
                        <div className="flex-1">
                            <div className="font-medium">Cabinet</div>
                            <div className="text-xs text-gray-500">{officeName}</div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border rounded-lg bg-white cursor-pointer hover:bg-gray-50">
                        <input
                        type="radio"
                        name="place"
                        value="home"
                        className="mt-1"
                        checked={place === "home"}
                        onChange={() => onChange({ place: "home" })}/>
                        <div className="flex-1">
                            <div className="font-medium">Domicile</div>
                            <div className="text-xs text-gray-500">
                                Déplacement chez le patient
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
