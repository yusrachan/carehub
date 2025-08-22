export default function EventTypeSection({ value, onChange }) {
    const eventType = value.eventType || "";

    return (
        <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm">
                <span className="block text-gray-700 mb-1">Type d'événement</span>
                <select
                value={eventType}
                onChange={(e) => onChange({ eventType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white">
                    <option value="">—</option>
                    <option value="kine-session">Séance kiné</option>
                    <option value="blocked-slot">Créneau bloqué</option>
                    <option value="meeting">Réunion</option>
                    <option value="group-class">Cours collectif</option>
                    <option value="other">Autre</option>
                </select>
            </label>
        </div>
    );
}
