export default function DateTimeSection({ value, onChange }) {
    const { date="", time="", duration=30, place="home" } = value;

    return (
        <div className="grid sm:grid-cols-3 gap-3">
            <label className="text-sm">
                <span className="block text-gray-700 mb-1">Date</span>
                <input
                type="date"
                value={date}
                onChange={(e) => onChange({ date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white"/>
            </label>

            <label className="text-sm">
                <span className="block text-gray-700 mb-1">Heure</span>
                <input
                type="time"
                value={time}
                onChange={(e) => onChange({ time: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 bg-white"/>
            </label>

            <label className="text-sm">
                <span className="block text-gray-700 mb-1">Durée (min)</span>
                <input
                type="number"
                min="5"
                step="5"
                value={duration}
                onChange={(e) => onChange({ duration: parseInt(e.target.value) || 30 })}
                className="w-full border rounded-lg px-3 py-2 bg-white"/>
            </label>
        </div>
    );
}
