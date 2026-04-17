import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "";
const socket = io(API_URL || window.location.origin, {
  transports: ["websocket"]
});

export default function Admin({ view = "overview" }) {

  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [priceInput, setPriceInput] = useState({});
  const adminName = localStorage.getItem("adminName");

  const loadBookings = async () => {
    const res = await fetch(`${API_URL}/bookings`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/stations`)
      .then(res => res.json())
      .then(setStations);

    loadBookings();

    socket.on("update", data => {
      setStations(data);
      loadBookings();
    });

    socket.on("booking:update", () => {
      loadBookings();
    });

    return () => {
      socket.off("update");
      socket.off("booking:update");
    };
  }, []);

  const freeSlot = async (id) => {
    await fetch(`${API_URL}/free`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: id })
    });
  };

  const updatePrice = async (id) => {
    await fetch(`${API_URL}/set-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId: id,
        price: priceInput[id]
      })
    });
  };

  const uniqueUsers = new Set(bookings.map((booking) => booking.clientEmail)).size;
  const activeBookings = bookings.filter((booking) => booking.status === "active").length;
  const totalBookedSlots = bookings.length;
  const estimatedElectricityUsedKwh = totalBookedSlots * 7.5;

  const renderOverview = () => (
    <>
      <div className="admin-hero">
        <p className="admin-kicker">Admin Dashboard</p>
        <h1>Welcome, {adminName}</h1>
        <p>Overview of users, booked slots, and estimated electricity consumption.</p>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>Users</span>
          <strong>{uniqueUsers}</strong>
          <p>Total unique users who booked slots.</p>
        </div>

        <div className="admin-summary-card">
          <span>Booked Slots</span>
          <strong>{totalBookedSlots}</strong>
          <p>Total slots booked so far, including active and released.</p>
        </div>

        <div className="admin-summary-card">
          <span>Active Slots</span>
          <strong>{activeBookings}</strong>
          <p>Slots currently active and not yet released.</p>
        </div>

        <div className="admin-summary-card">
          <span>Electricity Consumed</span>
          <strong>{estimatedElectricityUsedKwh.toFixed(1)} kWh</strong>
          <p>Estimated from total booking history.</p>
        </div>
      </div>
    </>
  );

  const renderBookedSlots = () => (
    <section className="admin-section-card">
      <div className="admin-section-header">
        <div>
          <p className="admin-kicker">Booked Slots</p>
          <h2>Who Booked Slots</h2>
        </div>
      </div>

      <table className="admin-table-dark">
        <thead>
          <tr>
            <th>Client</th>
            <th>Email</th>
            <th>Station</th>
            <th>Location</th>
            <th>Status</th>
            <th>Booked At</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map(b => (
            <tr key={b._id}>
              <td>{b.clientName}</td>
              <td>{b.clientEmail}</td>
              <td>{b.stationName}</td>
              <td>{b.location}</td>
              <td>{b.status}</td>
              <td>{new Date(b.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6}>No bookings yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  const renderManage = () => (
    <section className="admin-section-card">
      <div className="admin-section-header">
        <div>
          <p className="admin-kicker">Manage Stations</p>
          <h2>Station Management</h2>
        </div>
      </div>

      <table className="admin-table-dark">
        <thead>
          <tr>
            <th>Station</th>
            <th>Location</th>
            <th>Total</th>
            <th>Occupied</th>
            <th>Price/hr</th>
            <th>Free</th>
            <th>Set Price</th>
          </tr>
        </thead>

        <tbody>
          {stations.map(s => {
            return (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.location}</td>
                <td>{s.totalSlots}</td>
                <td>{s.occupiedSlots}</td>
                <td>₹ {s.pricePerHour || 0}</td>
                <td>
                  <button onClick={() => freeSlot(s._id)}>Free</button>
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="New price"
                    onChange={e =>
                      setPriceInput({
                        ...priceInput,
                        [s._id]: e.target.value
                      })
                    }
                  />
                  <button onClick={() => updatePrice(s._id)}>Update</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="admin-bg">
      {view === "overview" && renderOverview()}
      {view === "booked" && renderBookedSlots()}
      {view === "manage" && renderManage()}
    </div>
  );
}
