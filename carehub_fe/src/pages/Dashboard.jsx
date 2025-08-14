import React from "react";
// import { TeamStatsCard } from "../components/TeamStatsCard";

export default function Dashboard({ officeId }) {
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="text-3xl font-bold text-center mb-6">Tableau de bord</div>
      <div className="mb-8">
        {/* <TeamStatsCard officeId={officeId} /> */}
      </div>
    </div>
  );
}