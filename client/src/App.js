import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Admin from "./pages/Admin";

function App() {
  const [page, setPage] = useState("login");
  const [role, setRole] = useState(null); // client or admin

  return (
    <div style={{ display: "flex" }}>

      {page !== "login" && (
        <Sidebar setPage={setPage} role={role} />
      )}

      <div style={{ marginLeft: page !== "login" ? 240 : 0, width: "100%" }}>
        {page === "login" && <Login setPage={setPage} setRole={setRole} />}
        {page === "dashboard" && role === "client" && <Dashboard />}
        {page === "charts" && role === "client" && <Charts />}
        {page === "admin" && role === "admin" && <Admin />}
      </div>
    </div>
  );
}

export default App;
