import "../style.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "";
const socket = io(API_URL || window.location.origin, {
  transports: ["websocket"]
});


export default function Dashboard() {
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const clientName = localStorage.getItem("clientName");
  const clientEmail = localStorage.getItem("clientEmail");

  const loadBookings = async () => {
    const res = await fetch(`${API_URL}/bookings`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.filter((booking) => booking.clientEmail === clientEmail));
    }
  };

useEffect(() => {
  fetch(`${API_URL}/stations`)
    .then(res => res.json())
    .then(setStations);

  loadBookings();

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("update", data => {
    setStations(data);
  });

  socket.on("booking:update", () => {
    loadBookings();
  });

  return () => {
    socket.off("update");
    socket.off("booking:update");
  };
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

      <div className="history-panel">
        <div className="history-header">
          <div>
            <p className="history-kicker">Your activity</p>
            <h2>Booking History</h2>
          </div>
          <span className="history-count">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</span>
        </div>

        <div className="history-list">
          {bookings.map((booking) => (
            <div className="history-item" key={booking._id}>
              <div>
                <h3>{booking.stationName}</h3>
                <p>{booking.location} Zone</p>
              </div>
              <div className="history-meta">
                <span className={`history-status ${booking.status}`}>{booking.status}</span>
                <span>{new Date(booking.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="history-empty">
              <h3>No bookings yet</h3>
              <p>Your booked chargers will show up here once you reserve a slot.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
