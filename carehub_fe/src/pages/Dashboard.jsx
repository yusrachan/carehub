import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, CreditCard, Euro, Clock, AlertCircle, Plus, FileText, ArrowRight } from "lucide-react";
import { useOffice } from "../context/OfficeContext";
import OfficeBadgeMenu from "../components/OfficeBadgeMenu";
import ProgressiveAppointmentForm from "../components/appointment-form/ProgressiveAppointmentForm"
import { api } from "../api";

const startOfDayISO = (d = new Date()) => {
  const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString();
};
const endOfDayISO = (d = new Date()) => {
  const x = new Date(d); x.setHours(23,59,59,999); return x.toISOString();
};
const monthBounds = (d = new Date()) => {
  const a = new Date(d.getFullYear(), d.getMonth(), 1);
  const b = new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
  return { start: a, end: b };
};
const fmtEUR = (n) => new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
const timeHM = (iso) => (iso ? new Date(iso).toTimeString().slice(0,5) : "—");
const cls = (...xs) => xs.filter(Boolean).join(" ");

const Card = ({ children, className = "" }) => (
  <div className={cls("rounded-2xl border bg-white shadow-sm", className)}>{children}</div>
);
const CardHeader = ({ children, className = "" }) => (
  <div className={cls("px-4 py-3 border-b bg-gray-50 rounded-t-2xl", className)}>{children}</div>
);
const CardBody = ({ children, className = "" }) => (
  <div className={cls("p-4", className)}>{children}</div>
);
const Kpi = ({ icon: Icon, label, value, hint }) => (
  <Card>
    <CardBody className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-slate-100"><Icon className="w-5 h-5 text-slate-700" /></div>
      <div className="min-w-0">
        <div className="text-sm text-slate-600">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      </div>
    </CardBody>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentOffice, loading: loadingOffice } = useOffice();

  const [loading, setLoading] = useState(true);
  const [apptsToday, setApptsToday] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [err, setErr] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [preset, setNewPreset] = useState(null);

  const headers = useMemo(
    () => (currentOffice ? { "X-Office-Id": String(currentOffice.id) } : undefined),
    [currentOffice]
  );

  async function fetchAll() {
    if (!currentOffice) { setLoading(false); return; }
    setLoading(true); setErr("");
    try {
      const params = { start: startOfDayISO(), end: endOfDayISO() };
      const { data: apData } = await api.get("/agenda/", { params, headers });
      setApptsToday(Array.isArray(apData) ? apData : []);

      const { data: invData } = await api.get("/invoices/", { headers });
      const list = Array.isArray(invData) ? invData : (Array.isArray(invData?.results) ? invData.results : []);
      setInvoices(list);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les données du tableau de bord.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, [currentOffice]);

  const { start: mStart, end: mEnd } = monthBounds();
  const invoicesThisMonth = useMemo(
    () => invoices.filter(i => {
      const d = i.sending_date ? new Date(i.sending_date) : null;
      return d && d >= mStart && d <= mEnd;
    }),
    [invoices, mStart, mEnd]
  );
  const paidMTD = useMemo(
    () => invoicesThisMonth.filter(i => i.state === "paid").reduce((s, i) => s + Number(i.amount || 0), 0),
    [invoicesThisMonth]
  );
  const pendingCount = useMemo(() => invoices.filter(i => i.state === "pending").length, [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.state === "overdue").length, [invoices]);

  const apptsSorted = useMemo(
    () => [...apptsToday].sort((a, b) => new Date(a.app_date) - new Date(b.app_date)),
    [apptsToday]
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d’ensemble des RDV et de la facturation</p>
        </div>
        {!loadingOffice && currentOffice ? (
          <OfficeBadgeMenu />
        ) : (
          <div className="text-sm text-gray-500">
            {loadingOffice ? "Chargement du cabinet…" : "Aucun cabinet sélectionné"}
          </div>
        )}
      </div>

      <ProgressiveAppointmentForm
        isOpen={newOpen}
        onClose={() => setNewOpen(false)}
        selectedDate={preset?.date ? preset.date.toISOString().slice(0, 10) : undefined}
        timeSlot={preset?.time}
        selectedPractitioner={preset?.practitioner ?? undefined}
        onCreated={() => {
          setNewOpen(false);
        }}/>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={Calendar} label="Rendez-vous du jour" value={loading ? "…" : apptsToday.length} />
        <Kpi icon={Euro} label="Revenus (mois en cours)" value={loading ? "…" : fmtEUR(paidMTD)} hint="Somme des factures payées" />
        <Kpi icon={CreditCard} label="Factures en attente" value={loading ? "…" : pendingCount} />
        <Kpi icon={AlertCircle} label="En retard" value={loading ? "…" : overdueCount} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Rendez-vous d’aujourd’hui
                </div>
                <button
                onClick={() => navigate("/agenda")}
                className="text-sm inline-flex items-center gap-1 text-[#466896] hover:underline">
                  Ouvrir l’agenda <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Chargement…</div>
              ) : apptsSorted.length === 0 ? (
                <div className="p-6 text-sm text-gray-600">Aucun rendez-vous aujourd’hui.</div>
              ) : (
                <ul className="divide-y">
                  {apptsSorted.map(a => {
                    const hm = timeHM(a.app_date);
                    const title =
                      a.patient_name ||
                      (typeof a.patient === "object" ? (a.patient.full_name || a.patient.name) : null) ||
                      (a.patient ? `Patient #${a.patient}` : "Séance");
                    const status = (a.status || a.state || "scheduled").toLowerCase();
                    const chip =
                      status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                      status === "cancelled" ? "bg-rose-100 text-rose-800 border-rose-200" :
                      "bg-slate-100 text-slate-700 border-slate-200";
                    return (
                      <li key={a.id} className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{title}</div>
                          <div className="text-xs text-gray-600 truncate">
                            {a.practitioner_name || (a.practitioner ? `Praticien #${a.practitioner}` : "—")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-800 tabular-nums">{hm}</span>
                          <span className={cls("text-xs px-2 py-1 rounded-full border", chip)}>{status}</span>
                          <button
                            onClick={() => navigate("/agenda")}
                            className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                          >
                            Ouvrir
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Colonne factures */}
        <div className="xl:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Factures en attente
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {loading ? (
                <div className="p-4 text-sm text-gray-500">Chargement…</div>
              ) : (
                <ul className="divide-y">
                  {invoices.filter(i => i.state === "pending").slice(0,6).map(i => (
                    <li key={i.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{i.reference_number || `FAC-${i.id}`}</div>
                        <div className="text-xs text-gray-600">
                          {i.patient_name || (typeof i.patient === "object" ? (i.patient.full_name || i.patient.name) : "")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{fmtEUR(i.amount)}</div>
                        <button
                          onClick={() => navigate(`/invoices/${i.id}`)}
                          className="text-xs text-[#466896] hover:underline"
                        >
                          Voir
                        </button>
                      </div>
                    </li>
                  ))}
                  {invoices.filter(i => i.state === "pending").length === 0 && (
                    <li className="p-4 text-sm text-gray-600">Aucune facture en attente.</li>
                  )}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" /> Actions rapides
              </div>
            </CardHeader>
            <CardBody className="space-y-2">
              <button
              onClick={() => {
                const now = new Date();
                const mins = now.getMinutes();
                const rounded = mins < 30 ? 30 : 60;
                now.setMinutes(rounded, 0, 0);

                setNewPreset({
                  date: new Date(),
                  time: now.toTimeString().slice(0,5),
                  practitioner: null,
                });
                setNewOpen(true);
              }}
              className="w-full inline-flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-gray-50">
                <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Nouveau RDV</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
              onClick={() => navigate("/invoices/new")}
              className="w-full inline-flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-gray-50">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Nouvelle facture</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
              onClick={() => navigate("/patients")}
              className="w-full inline-flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-gray-50">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Voir patients</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}
    </div>
  );
}
