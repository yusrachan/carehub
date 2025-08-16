import { useOffice } from "../../../context/OfficeContext"
import { api } from '../../../api'

const PLANS = [
    { code: 'Small_Cab', title: 'Petit cabinet', price: '30€/mois', features: ['1-3 employés'] },
    { code: 'Medium_Cab', title: 'Moyen cabinet', price: '70€/mois', features: ['4-9 employés'] },
    { code: 'Big_Cab', title: 'Grand cabinet', price: '120€/mois', features: ['10+ employés'] },
]


export default function SubscriptionTab() {
    const { currentOffice } = useOffice?.() || {};

    const startCheckout = async (plan) => {
        if (!currentOffice?.id) return alert("Sélectionne d'abord un cabinet.")
        const { data } = await api.post(`/subscriptions/offices/${currentOffice.id}/checkout/`, { plan })
        window.location = data.url;
    }

    const openPortal = async () => {
        if (!currentOffice?.id) return alert("Sélectionne d'abord un cabinet.")
        const { data } = await api.post(`/subscriptions/offices/${currentOffice.id}/portal`);
        window.location = data.url;
    }

    return (
        <div className="space-y-4 bg-white p-4 rounded-2xl shadow">
            <h2 className="text-lg font-medium">Abonnement</h2>
            <p className="text-sm text-gray-600">Gérez votre offre et vos moyens de paiement.</p>
            <div className="flex gap-2">
                <button onClick={startCheckout} className="px-4 py-2 rounded-xl bg-black text-white">S’abonner</button>
                <button onClick={openPortal} className="px-4 py-2 rounded-xl border">Gérer mon abonnement</button>
            </div>
        </div>
    )
}