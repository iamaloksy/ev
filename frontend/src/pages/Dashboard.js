import "../style.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});


export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const clientName = localStorage.getItem("clientName");

useEffect(() => {
  fetch("http://localhost:5000/stations")
    .then(res => res.json())
    .then(setStations);

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("update", data => {
    setStations(data);
  });

  return () => socket.off("update");
}, []);


  const zoneImages = {
    "City Center": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7",
    "Mall Road": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7",
    "Airport": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7",
    "Tech Park": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7"
  };

  return (
    <div className="dashboard-container">

      <div className="dash-header">
        <h1>Welcome, {clientName}</h1>
        <p>Voltage HUB Smart Charging Dashboard</p>
      </div>

      <h2>Nearest EV Stations</h2>

      <div className="station-grid">
        {stations.map(s => {
          const free = s.totalSlots - s.occupiedSlots;

          const statusClass =
            free >= 4 ? "good" :
            free >= 2 ? "medium" :
            "busy";

          return (
            <div className={`station-ui-card ${statusClass}`} key={s._id}>

              <img
                src={zoneImages[s.location] || zoneImages["City Center"]}
                className="station-img"
                alt="zone"
              />

              <h3>{s.name}</h3>
              <p className="zone">{s.location} Zone</p>
              <p>Price: ₹{s.pricePerHour}/hr</p>

              <div className="status">
                <span className="vacant">Vacant: {free}</span>
                <span className="occupied">Occupied: {s.occupiedSlots}</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
