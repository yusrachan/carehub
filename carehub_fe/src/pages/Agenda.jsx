import { useEffect, useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Settings, Clock, AlertCircle, User, Users, MapPin, X } from "lucide-react";
import { useOffice } from "../context/OfficeContext";
import { api } from "../api";

import ProgressiveAppointmentForm from "../components/appointment-form/ProgressiveAppointmentForm"

const ENDPOINTS = {
    practitioners: "/practitioners/",
    agenda: "/agenda/",
    createAgenda: "/agenda/",
};

function cls(...xs) {
    return xs.filter(Boolean).join(" ")
}

function formatFR(date) {
    try {
        return date.toLocaleDateString("fr-BE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    } catch {
        return date.toDateString()
    }
}

function minutesFromHM(hhmm) {
    const [h, m] = (hhmm || "00:00").split(":").map(Number)
    return h * 60 + m
}

function hmFromMinutes(mins) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0")
    const m = (mins % 60).toString().padStart(2, "0")
    return `${h}:${m}`
}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function ViewSelector({ view, setView }) {
    return (
        <select value={view} onChange={(e) => setView(e.target.value)} className="border rounded-lg px-2 py-1 bg-white">
            <option value="day">Jour</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
        </select>
    )
}

function PractitionerFilter({ practitioners, selected, onChange }) {
    const toggle = (id) => {
        const sid = String(id)
        if (selected.includes(id)) onChange(selected.filter((x) => x !== sid));
        else onChange([...selected, sid])
    }
    const all = () => onChange(practitioners.map((p) => String(p.id)))
    const none = () => onChange([])

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex -space-x-1 items-center">
                {practitioners.map((p) => (
                    <span key={p.id} title={p.name} className="inline-block w-3 h-3 rounded-full border" style={{ background: p.color || "#64748b" }} />
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {practitioners.map((p) => (
                    <label key={p.id} className={cls("px-2 py-1 rounded border text-sm cursor-pointer select-none", selected.includes(String(p.id)) ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50")}>
                        <input type="checkbox" className="mr-1 align-middle" checked={selected.includes(String(p.id))} onChange={() => toggle(p.id)} />
                        {p.name}
                    </label>
                ))}
                <button onClick={all} className="px-2 py-1 rounded border text-sm bg-white hover:bg-gray-50">Tout</button>
                <button onClick={none} className="px-2 py-1 rounded border text-sm bg-white hover:bg-gray-50">Aucun</button>
            </div>
        </div>
    )
}

function CalendarSettingsInline({ startHour, endHour, onChange }) {
    const [open, setOpen] = useState(false)
    const [tmpStart, setTmpStart] = useState(startHour)
    const [tmpEnd, setTmpEnd] = useState(endHour)
    const hours = Array.from({ length: 24 }, (_, i) => i)

    function apply() {
        onChange(tmpStart, tmpEnd)
        setOpen(false)
    }

    return (
        <div className="relative">
            <button className="px-2 py-1 border rounded bg-white text-sm inline-flex items-center gap-2" onClick={() => setOpen((v) => !v)}>
                <Settings className="w-4 h-4" /> Paramètres
            </button>
            {open && (
                <div className="absolute z-20 mt-2 w-64 p-3 rounded-lg border bg-white shadow">
                    <div className="text-sm font-medium mb-2">Plage horaire visible</div>
                    <div className="flex items-center gap-2">
                        <select value={tmpStart} onChange={(e) => setTmpStart(parseInt(e.target.value))} className="border rounded px-2 py-1 flex-1 bg-white">
                            {hours.slice(6, 13).map((h) => (
                                <option key={h} value={h}>{hmFromMinutes(h*60)}</option>
                            ))}
                        </select>
                        <span className="text-sm">→</span>
                        <select value={tmpEnd} onChange={(e) => setTmpEnd(parseInt(e.target.value))} className="border rounded px-2 py-1 flex-1 bg-white">
                            {hours.slice(16, 25).map((h) => (
                                <option key={h} value={h}>{hmFromMinutes(h*60)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={apply} className="flex-1 px-2 py-1 rounded bg-blue-600 text-white">Appliquer</button>
                        <button onClick={() => setOpen(false)} className="flex-1 px-2 py-1 rounded border">Annuler</button>
                    </div>
                </div>
            )}
        </div>
    )
}

function CalendarGrid({ date, appointments, practitioners, selectedPractitioners, startHour, endHour, onSlotClick, onEventClick, }) {
    const hours = useMemo(() => Array.from({ length: (endHour - startHour) +1 }, (_, i) => startHour + i), [startHour, endHour])
    const visiblePractitioners = practitioners.filter((p) => selectedPractitioners.includes(String(p.id)))

    const slotHeight = 24

    function topForHM(hhmm) {
        const m = minutesFromHM(hhmm)
        const m0 = startHour * 60
        return ((m - m0) / 30) * slotHeight
    }

    const eventsToday = useMemo(() => {
        return appointments.filter((a) => a.app_date ? sameDay(new Date(a.app_date), date) : true)
    }, [appointments, date])

    return (
        <div className="relative w-full border rounded-xl overflow-hidden bg-white">
            <div className="sticky top-0 z-10 grid" style={{ gridTemplateColumns: `100px repeat(${visiblePractitioners.length || 1}, minmax(0, 1fr))` }}>
                <div className="bg-gray-50 border-b p-2 text-xs text-gray-500 uppercase">Heure</div>
                {visiblePractitioners.map((p) => (
                    <div key={p.id} className="bg-gray-50 border-b p-2 text-sm font-medium flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: p.color || "#64748b" }} /> {p.name}
                    </div>
                ))}
                {visiblePractitioners.length === 0 && (
                    <div className="bg-gray-50 border-b p-2 text-sm text-gray-500">Aucun praticien sélectionné</div>
                )}
            </div>

            <div className="grid" style={{ gridTemplateColumns: `100px repeat(${visiblePractitioners.length || 1}, minmax(0, 1fr))` }}>
                <div className="relative">
                    {hours.map((h, idx) => (
                        <div key={h} className={cls("border-b text-xs text-gray-500 pr-2", idx === 0 ? "pt-6" : "")} style={{ height: slotHeight * 2 }}>
                            <div className="h-full flex items-start justify-end pt-1">{hmFromMinutes(h * 60)}</div>
                        </div>
                    ))}
                </div>

                {visiblePractitioners.map((p) => (
                    <div key={p.id} className="relative border-l">
                        {hours.map((h) => (
                            <div key={`${p.id}-${h}`} className="border-b" style={{ height: slotHeight * 2 }} />
                        ))}

                        {eventsToday
                            .filter((e) => String(e.practitioner) === String(p.id))
                            .map((e) => {
                                const startHM = e.startTime || e.time || (e.app_date ? new Date(e.app_date).toTimeString().slice(0,5) : "09:00");
                                const top = topForHM(startHM);
                                const height = Math.max(20, ((e.duration || e.duration_minutes || 30) / 30) * slotHeight);
                                const title = e.patient_name || e.patient || (e.patient_id ? `Patient #${e.patient_id}` : "Séance");
                                return (
                                    <div
                                    key={e.id}
                                    className="absolute left-1 right-1 rounded-lg shadow-sm border overflow-hidden cursor-pointer"
                                    style={{ top, height, background: "#eff6ff", borderColor: "#bfdbfe" }}
                                    onClick={() => onEventClick && onEventClick(e)}>
                                        <div className="px-2 py-1 text-xs font-medium text-blue-900 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {startHM}
                                        </div>
                                        <div className="px-2 pb-2 text-sm">
                                            <div className="font-semibold text-blue-900 truncate">{title}</div>
                                            <div className="text-xs text-blue-800 truncate">{e.type || "Séance"}</div>
                                        </div>
                                    </div>
                                );
                            })
                        }

                        {hours.map((h) => (
                            [0,30].map((m) => {
                                const hm = hmFromMinutes(h*60 + m);
                                const top = ((h*60 + m - startHour*60) / 30) * slotHeight;
                                return (
                                    <div
                                    key={`${p.id}-${hm}`}
                                    className="absolute left-1 right-1 h-6 group"
                                    style={{ top }}
                                    onClick={() => onSlotClick && onSlotClick(hm, p.id, date)}
                                    title={`Créer ${hm} – ${p.name}`}>
                                        <div className="hidden group-hover:block absolute inset-0 rounded bg-blue-50/70 border border-blue-200" />
                                    </div>
                                );
                            })
                        ))}
                    </div>
                ))}

                {visiblePractitioners.length === 0 && (
                    <div className="p-6 text-sm text-gray-600">Sélectionnez au moins un praticien pour afficher la grille.</div>
                )}
            </div>
        </div>
    )
}

function NewAppointmentModal({ open, onClose, onConfirm, preset, practitioners, defaultDate }) {
    const { currentOffice } = useOffice()
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")

    const [patientId, setPatientId] = useState("");
    const [practitioner, setPractitioner] = useState(preset?.practitioner || "");
    const [date, setDate] = useState(() => (defaultDate ? defaultDate.toISOString().slice(0,10) : ""));
    const [time, setTime] = useState(preset?.time || "09:00");
    const [duration, setDuration] = useState(30);
    const [place, setPlace] = useState("home");

    const [coverage, setCoverage] = useState("prescription");
    const [prescriptionId, setPrescriptionId] = useState("");
    const [pathologyCategoryId, setPathologyCategoryId] = useState("");

    useEffect(() => {
        if (open) {
            setErr("");
            setLoading(false);
            setPractitioner(preset?.practitioner || practitioners[0]?.id || "");
            setTime(preset?.time || "09:00");
            setDate(defaultDate ? defaultDate.toISOString().slice(0,10) : "");
        }
    }, [open, preset, practitioners, defaultDate]);

    if (!open) return null
    
    const canSubmit = patientId && practitioner && date && time && duration > 0 && (coverage === "prescription" ? true : !!pathologyCategoryId)

    const submit = async () => {
        try {
            setLoading(true)
            setErr("")
            const app_date = new Date(`${date}T${time}:00`)
            const payload = {
                patient: patientId,
                practitioner: practitioner,
                app_date: app_date.toISOString(),
                duration_minutes: Number(duration),
                place,
            }
            if (coverage === "prescription" && prescriptionId) payload.prescription = prescriptionId;
            if (coverage === "annual") payload.pathology_category = pathologyCategoryId;

            const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;
            const { data } = await api.post(ENDPOINTS.createAgenda, payload, { headers })
            onConfirm && onConfirm(data)
            onClose()
        } catch (e) {
            console.error(e)
            setErr("Impossible de créer le rendez-vous. Vérifiez les champs.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div className="font-semibold">Nouveau rendez-vous</div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>


                <div className="p-4 space-y-4">
                    {err && (
                        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                            <AlertCircle className="w-4 h-4"/> {err}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Patient (ID)</span>
                            <input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="ex: 123" className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Praticien</span>
                            <select value={practitioner} onChange={(e) => setPractitioner(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                                {practitioners.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    
                    <div className="grid sm:grid-cols-3 gap-3">
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Date</span>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Heure</span>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Durée (min)</span>
                            <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 30)} className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Lieu</span>
                            <select value={place} onChange={(e) => setPlace(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                                <option value="home">Domicile</option>
                                <option value="office">Cabinet</option>
                            </select>
                        </label>
                        <label className="text-sm">
                            <span className="block text-gray-700 mb-1">Couverture</span>
                            <select value={coverage} onChange={(e) => setCoverage(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white">
                                <option value="prescription">Prescription</option>
                                <option value="annual">Annuel</option>
                            </select>
                        </label>
                    </div>

                    {coverage === "prescription" ? (
                        <label className="text-sm block">
                            <span className="block text-gray-700 mb-1">Prescription (ID)</span>
                            <input value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)} placeholder="ex: 77" className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                    ) : (
                        <label className="text-sm block">
                            <span className="block text-gray-700 mb-1">Catégorie pathologie (ID)</span>
                            <input value={pathologyCategoryId} onChange={(e) => setPathologyCategoryId(e.target.value)} placeholder="ex: 1 (PC)" className="w-full border rounded-lg px-3 py-2 bg-white" />
                        </label>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50" disabled={loading}>Annuler</button>
                        <button
                        onClick={submit}
                        disabled={!canSubmit || loading}
                        className={cls("px-4 py-2 rounded-lg text-white", loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700")}>
                            {loading ? "Création…" : "Créer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DetailsPanel({ appointment, onClose }) {
    if (!appointment) return (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">Sélectionnez un rendez-vous</div>
    )
    
    const title = appointment.patient_name || appointment.patient || (appointment.patient_id ? `Patient #${appointment.patient_id}` : "Séance")
    const startHM = appointment.startTime || appointment.time || (appointment.app_date ? new Date(appointment.app_date).toTimeString().slice(0,5) : "—")

    return (
        <div className="h-full p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="font-semibold">Détails du rendez-vous</div>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="rounded-lg border bg-white p-3 space-y-2">
                <div className="flex items-center gap-2"><User className="w-4 h-4"/> <span className="font-medium">{title}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4"/> {startHM}</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4"/> {appointment.practitioner}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {appointment.room || appointment.place || "—"}</div>
                <div className="text-sm text-gray-600">Durée : {appointment.duration || appointment.duration_minutes || 30} min</div>
                {appointment.coverage_source && (
                    <div className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-100 border text-slate-700">Couverture : {appointment.coverage_source}</div>
                )}
                {appointment.is_over_annual && (
                    <div className="text-xs inline-flex items-center gap-2 px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700">Hors quota annuel</div>
                )}
            </div>
        </div>
    )
}

export default function Agenda() {
    const { currentOffice } = useOffice()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState("day")
    const [startHour, setStartHour] = useState(() => Number(localStorage.getItem('calendarStartHour') || 8))
    const [endHour, setEndHour] = useState(() => Number(localStorage.getItem('calendarEndHour') || 22))

    const [practitioners, setPractitioners] = useState([])
    const [selectedPractitioners, setSelectedPractitioners] = useState([])

    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [err, setErr] = useState("")

    const [selectedAppointment, setSelectedAppointment] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [preset, setPreset] = useState(null)

    useEffect(() => {
        let mounted = true
        async function fetchPractitioners() {
            try {
                setLoading(true)
                setErr("");
                const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;
                const { data } = await api.get(ENDPOINTS.practitioners, { headers })
                if (!mounted) return
                const list = Array.isArray(data) ? data : []
                setPractitioners(list)
                try {
                    const raw = localStorage.getItem("appointments_selected_practitioners")
                    const saved = raw ? JSON.parse(raw) : null
                    const allIds = list.map((p) => String(p.id))
                    setSelectedPractitioners(Array.isArray(saved) && saved.length ? saved.map(String).filter((id) => allIds.includes(id)) : allIds)
                } catch {
                    setSelectedPractitioners(list.map((p) => String(p.id)))
                }
            } catch (e) {
                console.error(e)
                if (!mounted) return;
                setErr("Impossible de charger les praticiens.")
                setPractitioners([])
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchPractitioners()
        return () => { mounted = false; }
    }, [currentOffice])

    useEffect(() => {
        try {
            localStorage.setItem("appointments_selected_practitioners", JSON.stringify(selectedPractitioners))
        } catch {
        }
    }, [selectedPractitioners])

    const range = useMemo(() => {
        const d0 = new Date(currentDate)
        d0.setHours(0,0,0,0)
        const d1 = new Date(currentDate)
        d1.setHours(23,59,59,999)
        
        return{
            start: d0.toISOString(),
            end: d1.toISOString()
        }
    }, [currentDate])

    useEffect(() => {
        let mounted = true
        async function fetchAgenda() {
            try {
                setLoading(true); setErr("");
                const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;
                const params = { start: range.start, end: range.end };
                if (selectedPractitioners.length) params.practitioners = selectedPractitioners.join(",");
                const { data } = await api.get(ENDPOINTS.agenda, { params, headers });
                if (!mounted) return;
                setAppointments(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                if (e?.response) {
                    console.log("403 payload:", e.response.status, e.response.data); // ← important
                }
                if (!mounted) return;
                setErr("Impossible de charger les rendez-vous.");
                setAppointments([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        if (practitioners.length) fetchAgenda();
        else setLoading(false)
    }, [range, selectedPractitioners, practitioners, currentOffice]);

    const selectedSet = useMemo(
        () => new Set((selectedPractitioners || []).map(String)),
        [selectedPractitioners]
    );

    const filteredAppointments = useMemo(
        () =>
            appointments.filter((a) => {
                const pid = a?.practitioner != null ? String(a.practitioner) : "";
                return selectedSet.size ? selectedSet.has(pid) : true;
            }),
            [appointments, selectedSet]
    );

    function navigateDate(dir) {
        const d = new Date(currentDate);
        if (view === "day") d.setDate(currentDate.getDate() + (dir === "next" ? 1 : -1));
        else if (view === "week") d.setDate(currentDate.getDate() + (dir === "next" ? 7 : -7));
        else d.setMonth(currentDate.getMonth() + (dir === "next" ? 1 : -1));
        setCurrentDate(d);
    }

    function handleSlotClick(hm, practitionerId, date) {
        setPreset({ time: hm, practitioner: practitionerId, date });
        setModalOpen(true);
    }

    async function handleCreated(newAgendaRow) {
        try {
            const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;
            const params = { start: range.start, end: range.end };
            if (selectedPractitioners.length) params.practitioners = selectedPractitioners.join(",");
            const { data } = await api.get(ENDPOINTS.agenda, { params, headers });
            setAppointments(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 h-full overflow-x-hidden">
            <div className="flex items-center gap-4">
                <div className="flex justify-between items-center flex-1">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Calendrier</h1>
                        <p className="text-gray-600 text-sm lg:text-base">Planning et gestion des rendez-vous</p>
                    </div>
                    <button
                    className="inline-flex items-center gap-2 rounded-xl bg-[#466896] text-white px-4 py-2"
                    onClick={() => { setPreset(null); setModalOpen(true); }}
                    disabled={!practitioners.length}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nouveau RDV</span>
                        <span className="sm:hidden">Nouveau</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-4">
                    <div className="flex items-center gap-2">
                        <button className="border rounded-lg p-2 bg-white" onClick={() => navigateDate("prev")}><ChevronLeft className="w-4 h-4" /></button>
                        <div className="min-w-0 text-center">
                            <span className="font-medium text-sm lg:text-base capitalize">{formatFR(currentDate)}</span>
                        </div>
                        <button className="border rounded-lg p-2 bg-white" onClick={() => navigateDate("next")}><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <button className="border rounded-lg px-3 py-2 bg-white" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</button>
                </div>


                <div className="flex flex-wrap gap-2 lg:gap-3 items-center">
                    <CalendarSettingsInline
                    startHour={startHour}
                    endHour={endHour}
                    onChange={(s, e) => {
                        setStartHour(s); setEndHour(e);
                        try { localStorage.setItem('calendarStartHour', String(s)); localStorage.setItem('calendarEndHour', String(e)); } catch {}
                    }}/>
                    <PractitionerFilter practitioners={practitioners} selected={selectedPractitioners} onChange={setSelectedPractitioners} />
                    <ViewSelector view={view} setView={setView} />
                </div>
            </div>

            <div className="hidden lg:grid lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 xl:col-span-9 min-h-[70vh]">
                    {view === "day" ? (
                        <CalendarGrid
                        date={currentDate}
                        appointments={filteredAppointments}
                        practitioners={practitioners}
                        selectedPractitioners={selectedPractitioners}
                        startHour={startHour}
                        endHour={endHour}
                        onSlotClick={handleSlotClick}
                        onEventClick={(e) => setSelectedAppointment(e)}/>
                    ) : (
                        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">Les vues "Semaine" et "Mois" seront ajoutées plus tard. Utilisez la vue Jour pour l'instant.</div>
                    )}
                </div>
                <div className="lg:col-span-4 xl:col-span-3 min-h-[70vh] rounded-xl border bg-white">
                    <DetailsPanel appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />
                </div>
            </div>

            {loading && (
                <div className="text-sm text-gray-500">Chargement…</div>
            )}
            {err && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    <AlertCircle className="w-4 h-4"/> {err}
                </div>
            )}
            <ProgressiveAppointmentForm
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            timeSlot={preset?.time}
            selectedPractitioner={preset?.practitioner}
            selectedDate={preset?.date ? preset.date.toISOString().slice(0,10) : undefined}
            onCreated={handleCreated}/>
        </div>
    )
}