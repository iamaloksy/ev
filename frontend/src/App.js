import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Admin from "./pages/Admin";
import SlotBooking from "./pages/SlotBooking";
import Login from "./pages/Login";


function App() {
  const [page, setPage] = useState("login");
  const [role, setRole] = useState("");

  const loginClient = () => {
    setRole("client");
    setPage("dashboard");
  };

  const loginAdmin = () => {
    setRole("admin");
    setPage("admin");
  };

  return (
    <div style={{ display: "flex" }}>
      {page !== "login" && <Sidebar setPage={setPage} role={role} />}

      <div style={{ marginLeft: page !== "login" ? 240 : 0, width: "100%" }}>
        {page === "login" && (
          <Login
            loginClient={loginClient}
            loginAdmin={loginAdmin}
          />
        )}

        {page === "dashboard" && role === "client" && <Dashboard />}
        {page === "charts" && role === "client" && <Charts />}
        {page === "admin" && role === "admin" && <Admin />}
        {page === "slot" && role === "client" && <SlotBooking />}
      </div>
    </div>
  );
}

export default App;
