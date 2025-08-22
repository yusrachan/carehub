export default function AdditionalInfoSection({ value, onChange }) {
    const { notes="" } = value;
    return (
        <label className="text-sm block">
            <span className="block text-gray-700 mb-1">Notes</span>
            <textarea
                rows={4}
                value={notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                placeholder="Infos complémentaires (facultatif)"
                className="w-full border rounded-lg px-3 py-2 bg-white"/>
        </label>
    );
}
