import "../style.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});


export default function SlotBooking() {
  const [stations, setStations] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

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



  const book = async (id) => {
    const res = await fetch("http://localhost:5000/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: id })
    });

    if (res.ok) {
      setShowPopup(true);

      // auto close after 2 seconds
      setTimeout(() => setShowPopup(false), 2000);
    }
  };

  return (
    <div className="booking-container">
      <h1>Slot Booking</h1>

      {stations.map(s => (
        <div className="station-card" key={s._id}>
          <h2>{s.name} — {s.location}</h2>
        <p>Price: ₹{s.pricePerHour}/hr</p>

          <div className="slot-grid">
            {[...Array(s.totalSlots)].map((_, i) => {
              const occupied = i < s.occupiedSlots;

              return (
                <div
                  key={i}
                  className={`slot ${occupied ? "occupied" : "available"}`}
                  onClick={() => !occupied && book(s._id)}
                >
                  Slot {i + 1}
                  <small>{occupied ? "Occupied" : "Available"}</small>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* POPUP MODAL */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2> Slot Booked Successfully!</h2>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
