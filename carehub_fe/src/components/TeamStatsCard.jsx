import React, { useEffect, useState } from "react";

export const TeamStatsCard = ({ officeId }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/offices/${officeId}/members/`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
      }
    })
      .then(res => res.json())
      .then(data => setCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setCount(0));
  }, [officeId]);

  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div>
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-gray-500">Membres du cabinet</div>
      </div>
    </div>
  );
};