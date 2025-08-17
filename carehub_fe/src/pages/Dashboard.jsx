import React from "react";
// import { TeamStatsCard } from "../components/TeamStatsCard";
import { useOffice } from "../context/OfficeContext";
import OfficeBadgeMenu from "../components/OfficeBadgeMenu";


export default function Dashboard({ officeId }) {
  const { currentOffice, loading } = useOffice()

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="text-3xl font-bold text-center mb-6">Tableau de bord</div>
      <div className="mb-8">
        {/* <TeamStatsCard officeId={officeId} /> */}
         {!loading && currentOffice ? (
          <OfficeBadgeMenu />
        ) : (
          <div className="text-sm text-gray-500">
            {loading ? "Chargement du cabinet…" : "Aucun cabinet sélectionné"}
          </div>
        )}
      </div>
    </div>
  );
}