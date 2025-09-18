import { useEffect, useRef, useState } from "react";

export default function ConfirmActionModal({ open, title = "Confirmer l'action", description = "", confirmLabel = "Confirmer", cancelLabel = "Annuler", onConfirm, onClose, requireReason = true, initialReason = "", closeAfterConfirm = true, }) {
    
    const [reason, setReason] = useState(initialReason || "");
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) setReason(initialReason || "");
    }, [open, initialReason]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
            }
            if (e.key === "Enter" && (!requireReason || reason.trim())) {
                e.preventDefault();
                handleConfirm();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, reason, requireReason, onClose]);

    useEffect(() => {
        if (open && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    if (!open) return null;

    const canConfirm = !requireReason || reason.trim().length > 0;

    const handleConfirm = async () => {
        try {
        await onConfirm?.(reason);
        } finally {
        if (closeAfterConfirm) onClose?.();
        }
    };

    const handleCancel = (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        onClose?.();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
            {/* carte */}
            <div className="relative z-50 w-full max-w-lg px-4">
                <div
                className="w-full rounded-2xl bg-white shadow-xl border p-5"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}>
                    <div className="text-xl font-semibold">{title}</div>
                    {description && <p className="text-gray-600 mt-2">{description}</p>}

                    {requireReason && (
                        <div className="mt-4">
                            <label className="block text-sm text-gray-600 mb-1">Motif</label>
                            <textarea
                            ref={inputRef}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full border rounded-xl p-2 bg-white"/>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-2">
                        <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-xl border">
                            {cancelLabel}
                        </button>
                        <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        className={`px-4 py-2 rounded-xl ${
                            canConfirm
                            ? "bg-[#466896] text-white hover:opacity-95"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
