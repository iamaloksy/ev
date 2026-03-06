import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"]
});

export default function Admin() {

  const [stations, setStations] = useState([]);
  const [priceInput, setPriceInput] = useState({});
  const adminName = localStorage.getItem("adminName");

  useEffect(() => {
    fetch("http://localhost:5000/stations")
      .then(res => res.json())
      .then(setStations);

    socket.on("update", data => setStations(data));

    return () => socket.off("update");
  }, []);

  const freeSlot = async (id) => {
    await fetch("http://localhost:5000/free", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: id })
    });
  };

  const updatePrice = async (id) => {
    await fetch("http://localhost:5000/set-price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationId: id,
        price: priceInput[id]
      })
    });
  };

  return (
    <div className="admin-bg">
      <h1>Welcome, {adminName}</h1>

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
          {stations.map(s => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
