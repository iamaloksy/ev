import React, { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "";

function BookingForm() {
  const [data, setData] = useState({
    user: "",
    station: "",
    time: ""
  });

  const bookSlot = async () => {
    await fetch(`${API_URL}/bookings/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    alert("Slot Booked!");
  };

  return (
    <div>
      <h2>Book Charging Slot</h2>
      <input placeholder="User Name" onChange={e => setData({...data, user:e.target.value})}/>
      <input placeholder="Station Name" onChange={e => setData({...data, station:e.target.value})}/>
      <input placeholder="Time" onChange={e => setData({...data, time:e.target.value})}/>
      <button onClick={bookSlot}>Book</button>
    </div>
  );
}

export default BookingForm;
