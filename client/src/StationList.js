import React, { useEffect, useState } from "react";

function StationList() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/stations")
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
