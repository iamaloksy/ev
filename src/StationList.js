import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "/api";

function StationList() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/stations`)
      .then(res => res.json())
      .then(data => setStations(data));
  }, []);

  return (
    <div>
      <h2>Available Stations</h2>
      {stations.map((s, i) => (
        <p key={i}>
          {s.name} - {s.location} - Slots: {s.availableSlots}
        </p>
      ))}
    </div>
  );
}

export default StationList;
