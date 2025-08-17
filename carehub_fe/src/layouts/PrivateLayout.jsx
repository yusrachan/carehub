import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { OfficeProvider } from "../context/OfficeContext";

export default function PrivateLayout() {
    return(
        <OfficeProvider>
            <div className="flex min-h-screen">
                <Sidebar/>
                <main className="flex-1 p-6">
                    <Outlet/>
                </main>
            </div>
        </OfficeProvider>
    );
}