export default function Sidebar({ onNavigate, onLogout, role }) {
  return (
    <div className="sidebar">
      <h2> Voltage HUB</h2>

      {role === "client" && (
        <>
          <button onClick={() => onNavigate("/client")}>
            Dashboard
          </button>
          <button onClick={() => onNavigate("/client/charts")}>
            Analytics
          </button>
          <button onClick={() => onNavigate("/client/slot")}>
            Slot Booking
          </button>
        </>
      )}

      {role === "admin" && (
        <>
          <button onClick={() => onNavigate("/admin")}>
            Admin Panel
          </button>
          <button onClick={() => onNavigate("/admin/booked")}>
            Booked Slots
          </button>
          <button onClick={() => onNavigate("/admin/manage")}>
            Manage
          </button>
        </>
      )}

      <button onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
