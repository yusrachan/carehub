import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Invoices from "./pages/Invoices";
import AgendaPage from "./pages/Agenda";
import LandingPage from "./pages/LandingPage";
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationError from "./pages/RegistrationError";
import RegisterJoin from "./pages/RegisterJoin";
import TeamPage from "./pages/TeamPage";

function App() {
  const officeId = Number(localStorage.getItem("officeId"))
  const userRole = localStorage.getItem("userRole")

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout/>}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-join" element={<RegisterJoin />} />
          <Route path="/register-success" element={<RegistrationSuccess />} />
          <Route path="/register-error" element={<RegistrationError />} />
        </Route>

        <Route element={<PrivateLayout/>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/team" element={
            (officeId && userRole)
            ? <TeamPage officeId={officeId} userRole={userRole} />
            : <div>Chargement...</div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
