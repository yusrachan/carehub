import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Invoices from "./pages/Invoices";
import NewInvoice from "./pages/NewInvoice";
import InvoiceDetail from "./pages/InvoiceDetail";
import AgendaPage from "./pages/Agenda";
import LandingPage from "./pages/LandingPage";
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterJoin from "./pages/RegisterJoin";
import TeamPage from "./pages/TeamPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import Paywall from "./pages/Paywall";
import PatientRecord from "./pages/PatientRecord";

export default function App() {
  return (
      <Routes>
        <Route element={<PublicLayout/>}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-join" element={<RegisterJoin />} />
        </Route>
        
        <Route path="/paywall" element={<Paywall />} />

        <Route element={<PrivateLayout/>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientRecord />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/team" element={<TeamPage/>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
  );
}