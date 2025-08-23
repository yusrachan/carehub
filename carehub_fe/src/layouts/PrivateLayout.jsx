import { Outlet, replace, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { OfficeProvider } from "../context/OfficeContext";
import { useEffect } from "react";
import { api } from "../api";

export default function PrivateLayout() {
    const location = useLocation()
    const navigate = useNavigate()

    useEffect(() => {
        let alive = true

        if (location.pathname.startsWith("/paywall")) return;

        (async () => {
            try {
                const { data } = await api.get("/subscriptions/status/")
                if (alive && data && data.is_active === false){
                    Navigate("/paywall", { replace: true })
                }
            } catch {
                
            }
        })()
        return () => { alive = false }
    }, [location.pathname, navigate])

    return(
        <OfficeProvider>
            <div className="min-h-screen">
                <Sidebar/>
                <main className="fixed inset-y-0 right-0 left-72 overflow-y-auto p-6 min-w-0">
                    <Outlet/>
                </main>
            </div>
        </OfficeProvider>
    );
}