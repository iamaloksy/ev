export default function Sidebar({ setPage, role }) {
  return (
    <div className="sidebar">
      <h2> Voltage HUB</h2>

      {role === "client" && (
        <>
          <button onClick={() => setPage("dashboard")}>
            Dashboard
          </button>
          <button onClick={() => setPage("charts")}>
            Analytics
          </button>
                <button onClick={() => setPage("slot")}>
  Slot Booking
</button>
        </>
      )}
      <button onClick={() => setPage("login")}>
        Logout
      </button>
    </div>
  );
}
