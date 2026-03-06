import { useState } from "react";

export default function Login({ loginClient, loginAdmin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password.trim()
      })
    });

    if (res.ok) {
      alert("Registered! Now login");
      setIsRegister(false);
    } else {
      alert("User already exists");
    }
  };

  const login = async () => {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim()
      })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("clientName", data.name);
      loginClient();
    } else {
      alert("Invalid login");
    }
  };

const adminLogin = async () => {

  const res = await fetch("http://localhost:5000/admin-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  if (res.ok) {

    const data = await res.json();

    localStorage.setItem("adminName", data.name);

    window.location.href = "/admin";   // open admin page

  } else {
    alert("Invalid login");
  }
};



  return (
    <div className="dual-login">
      <div className="app-title">Voltage HUB</div>

      <div className="login-panel">
        <h2>{isRegister ? "Register" : "Client Login"}</h2>

        {isRegister && (
          <input
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {isRegister ? (
          <button onClick={register}>Register</button>
        ) : (
          <button onClick={login}>Login</button>
        )}

        <p
          style={{ cursor: "pointer", marginTop: 10 }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "Already have account? Login" : "New user? Register"}
        </p>

        <hr />

       <button onClick={adminLogin}>
  Admin Login
</button>
      </div>
    </div>
  );
}
