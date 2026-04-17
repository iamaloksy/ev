import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Admin from "./pages/Admin";
import SlotBooking from "./pages/SlotBooking";
import Login from "./pages/Login";


function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setPath(nextPath);
  };

  const role = useMemo(() => {
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/client")) return "client";
    return "";
  }, [path]);

  const clientAuthed = Boolean(localStorage.getItem("clientName"));
  const adminAuthed = Boolean(localStorage.getItem("adminName"));

  let page = "login";
  if (path === "/client") page = "dashboard";
  if (path === "/client/charts") page = "charts";
  if (path === "/client/slot") page = "slot";
  if (path === "/admin") page = "admin";
  if (path === "/admin/booked") page = "admin-booked";
  if (path === "/admin/manage") page = "admin-manage";

  if (role === "client" && !clientAuthed) {
    page = "login";
  }

  if (role === "admin" && !adminAuthed) {
    page = "login";
  }

  const loginClient = () => {
    navigate("/client");
  };

  const loginAdmin = () => {
    navigate("/admin");
  };

  const logout = () => {
    localStorage.removeItem("clientName");
    localStorage.removeItem("clientEmail");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <div style={{ display: "flex" }}>
      {page !== "login" && <Sidebar role={role} onNavigate={navigate} onLogout={logout} />}

      <div style={{ marginLeft: page !== "login" ? 240 : 0, width: "100%" }}>
        {page === "login" && (
          <Login
            loginClient={loginClient}
            loginAdmin={loginAdmin}
          />
        )}

        {page === "dashboard" && role === "client" && <Dashboard />}
        {page === "charts" && role === "client" && <Charts />}
        {page === "admin" && role === "admin" && <Admin view="overview" />}
        {page === "admin-booked" && role === "admin" && <Admin view="booked" />}
        {page === "admin-manage" && role === "admin" && <Admin view="manage" />}
        {page === "slot" && role === "client" && <SlotBooking />}
      </div>
    </div>
  );
}

export default App;
