import { AlertCircle, CalendarClock, ClipboardList, User, Stethoscope, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useOffice } from "../../context/OfficeContext";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api";

import OfficePractitionerSection from "./sections/OfficePractitionerSection";
import EventTypeSection from "./sections/EventTypeSection";
import DateTimeSection from "./sections/DateTimeSection";
import DynamicDetailsSection from "./sections/DynamicDetailsSection";
import AdditionalInfoSection from "./sections/AdditionalInfoSection";
import ProgressiveSection from "./ProgressiveSection";

const ENDPOINTS = {
    practitioners: "/practitioners/",
    agenda: "/agenda/",
}

export default function ProgressiveAppointmentForm({ isOpen, onClose, onCreated, timeSlot, selectedPractitioner, selectedDate }) {
    const { currentOffice } = useOffice()

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState("")
    const [practitioners, setPractitioners] = useState([])
    const [pathologyCats, setPathologyCats] = useState([]);

    const [form, setForm] = useState({
        officeId: null,
        practitionerId: selectedPractitioner || "",
        eventType: "",
        date: selectedDate || "",
        time: timeSlot || "",
        duration: 30,
        place: "office",
        patientId: "",
        coverage: "prescription",
        prescriptionId: "",
        pathologyCategoryId: "",
        blockReason: "",
        meetingTitle: "",
        classType: "",
        customTitle: "",
        notes: "",
    })

    useEffect(() => {
        if (isOpen) {
            setErr("")
            setLoading(false)
            setForm((f) => ({
                ...f,
                officeId: currentOffice ? currentOffice.id : null,
                practitionerId: selectedPractitioner || f.practitionerId || "",
                date: selectedDate || f.date || "",
                time: timeSlot || f.time || "",
            }))
        } else {

        }
    }, [isOpen, currentOffice, selectedPractitioner, selectedDate, timeSlot])

    useEffect(() => {
        let mounted = true
        async function run() {
            try {
                setErr("")
                const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined
                const { data } = await api.get(ENDPOINTS.practitioners, { headers })
                if (!mounted) return
                const list = Array.isArray(data) ? data : []
                setPractitioners(list)
                setForm((f) => ({
                    ...f,
                    practitionerId: f.practitionerId || list[0]?.id || "",
                }))
            } catch (e) {
                if (!mounted) return
                console.error(e)
                setErr("Impossible de charger les praticiens.")
                setPractitioners([])
            }
        }
        if (isOpen) run();
        return () => { mounted = false }
    }, [isOpen, currentOffice])

    useEffect(() => {
        let mounted = true;
        async function loadCats() {
            try {
                const { data } = await api.get("/pathology-categories/");
                if (!mounted) return;
                setPathologyCats(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load pathology categories", e);
                setPathologyCats([]);
            }
        }
        if (isOpen) loadCats();
        return () => { mounted = false; };
    }, [isOpen]);

    const sectionOfficeValid = useMemo(() => {
        return !!form.practitionerId && !!(currentOffice && currentOffice.id);
    }, [form.practitionerId, currentOffice]);

    const sectionTypeValid = useMemo(() => {
        return !!form.eventType;
    }, [form.eventType]);

    const sectionDateTimeValid = useMemo(() => {
        return !!form.date && !!form.time && Number(form.duration) > 0;
    }, [form.date, form.time, form.duration]);

    const sectionDynamicValid = useMemo(() => {
        if (form.eventType === "kine-session") {
        if (!form.patientId) return false;
        if (form.coverage === "prescription") {
            return true;
        }
        if (form.coverage === "annual") {
            return !!form.pathologyCategoryId;
        }
        return false;
        }
        if (form.eventType === "blocked-slot") return !!form.blockReason;
        if (form.eventType === "meeting") return !!form.meetingTitle;
        if (form.eventType === "group-class") return !!form.classType;
        if (form.eventType === "other") return !!form.customTitle;
        return false;
    }, [form]);

    const sectionAdditionalValid = true; // notes optionnelles

    const isComplete = () =>
        sectionOfficeValid && sectionTypeValid && sectionDateTimeValid && sectionDynamicValid && sectionAdditionalValid;

    const updateForm = (patch) => setForm((f) => ({ ...f, ...patch }));

    async function submit() {
        try {
            setLoading(true);
            setErr("");
            if (!isComplete()) return;

            const headers = currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined;

            const iso = new Date(`${form.date}T${form.time}:00`).toISOString();
            const payload = {
                practitioner: form.practitionerId,
                app_date: iso,
                duration_minutes: Number(form.duration),
                place: form.place,
                is_bim: !!form.isBim,
                notes: form.notes || undefined,
            };

            if (form.eventType === "kine-session") {
                payload.patient = form.patientId;
                if (form.coverage === "prescription" && form.prescriptionId) {
                    payload.prescription = form.prescriptionId;
                } else if (form.coverage === "annual") {
                    payload.pathology_category = form.pathologyCategoryId;
                }
            } else {
                payload.reason =
                form.eventType === "blocked-slot" ? `BLOQUE: ${form.blockReason}` :
                form.eventType === "meeting" ? `REUNION: ${form.meetingTitle}` :
                form.eventType === "group-class" ? `COURS: ${form.classType}` :
                form.customTitle || "EVENEMENT";
            }

            const { data } = await api.post(ENDPOINTS.agenda, payload, { headers });
            onCreated && onCreated(data);
            onClose();
        } catch (e) {
            console.error(e);
            const data = e?.response?.data;
            console.log("400 payload:", data);

            const firstFieldErr =
                data && typeof data === "object"
                ? Object.values(data).flat().find(Boolean)
                : null;

            setErr(firstFieldErr || "Création impossible. Vérifiez les champs.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="shrink-0 p-6 pb-0">
                    <DialogTitle className="text-xl font-semibold">Nouveau rendez-vous</DialogTitle>
                </DialogHeader>

                <div className="flex-1 px-6 overflow-y-auto">
                    <div className="space-y-6 py-6">
                        {err && (
                            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                                <AlertCircle className="w-4 h-4" /> {err}
                            </div>
                        )}

                        <ProgressiveSection
                        title="Cabinet & Thérapeute"
                        icon={<Stethoscope className="w-4 h-4" />}
                        isValid={sectionOfficeValid}
                        isExpanded={true}
                        >
                        <OfficePractitionerSection
                            practitioners={practitioners}
                            office={currentOffice}
                            value={{
                                practitionerId: form.practitionerId,
                                place: form.place,
                            }}
                            onChange={(patch) => updateForm(patch)}/>
                        </ProgressiveSection>

                        <ProgressiveSection
                        title="Type d'événement"
                        icon={<ClipboardList className="w-4 h-4" />}
                        isValid={sectionTypeValid}
                        isExpanded={sectionOfficeValid}
                        isDisabled={!sectionOfficeValid}>
                            <EventTypeSection value={{ eventType: form.eventType }} onChange={updateForm} />
                        </ProgressiveSection>

                        <ProgressiveSection
                        title="Date & heure"
                        icon={<CalendarClock className="w-4 h-4" />}
                        isValid={sectionDateTimeValid}
                        isExpanded={sectionOfficeValid && sectionTypeValid}
                        isDisabled={!sectionOfficeValid || !sectionTypeValid}>
                        <DateTimeSection
                            value={{
                                date: form.date,
                                time: form.time,
                                duration: form.duration,
                            }}
                            onChange={updateForm}/>
                        </ProgressiveSection>

                        <ProgressiveSection
                        title="Détails spécifiques"
                        icon={<User className="w-4 h-4" />}
                        isValid={sectionDynamicValid}
                        isExpanded={sectionOfficeValid && sectionTypeValid && sectionDateTimeValid}
                        isDisabled={!sectionOfficeValid || !sectionTypeValid || !sectionDateTimeValid}>
                            <DynamicDetailsSection
                                eventType={form.eventType}
                                value={{
                                    patientId: form.patientId,
                                    coverage: form.coverage,
                                    prescriptionId: form.prescriptionId,
                                    pathologyCategoryId: form.pathologyCategoryId,
                                    blockReason: form.blockReason,
                                    meetingTitle: form.meetingTitle,
                                    classType: form.classType,
                                    customTitle: form.customTitle,
                                }}
                                pathologyCategories={pathologyCats}
                                onChange={updateForm}/>
                        </ProgressiveSection>

                        <ProgressiveSection
                        title="Informations complémentaires"
                        icon={<Info className="w-4 h-4" />}
                        isValid={sectionAdditionalValid}
                        isExpanded={sectionOfficeValid && sectionTypeValid && sectionDateTimeValid}
                        isDisabled={!sectionOfficeValid || !sectionTypeValid || !sectionDateTimeValid}>
                            <AdditionalInfoSection value={{ notes: form.notes }} onChange={updateForm} />
                        </ProgressiveSection>
                    </div>
                </div>

                <div className="shrink-0 p-6 pt-4 flex justify-end gap-3 border-t bg-background">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button onClick={submit} disabled={!isComplete() || loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? "Création…" : "Créer le rendez-vous"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}