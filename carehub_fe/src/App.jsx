import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Invoices from "./pages/Invoices";
import CalendarPage from "./pages/Appointments";
import LandingPage from "./pages/LandingPage";
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterOffice from "./pages/RegisterOffice";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import RegistrationError from "./pages/RegistrationError";
import SignUpChoiceForm from "./components/SignUpChoiceForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout/>}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-office" element={<RegisterOffice />} />
          <Route path="/register-choice" element={<SignUpChoiceForm />} />
          <Route path="/register-success" element={<RegistrationSuccess />} />
          <Route path="/register-error" element={<RegistrationError />} />
        </Route>

        <Route element={<PrivateLayout/>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<CalendarPage />} />
          <Route path="/invoices" element={<Invoices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
