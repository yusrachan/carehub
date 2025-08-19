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
            <div className="flex min-h-screen">
                <Sidebar/>
                <main className="flex-1 p-6">
                    <Outlet/>
                </main>
            </div>
        </OfficeProvider>
    );
}