import { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "/api";

export default function Login({ loginClient, loginAdmin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const clearMessages = () => {
    setStatusText("");
    setErrorText("");
  };

  const validateForm = () => {
    if (!email.trim() || !password.trim() || (isRegister && !name.trim())) {
      setErrorText("Please fill all required fields");
      return false;
    }
    return true;
  };

  const register = async () => {
    if (isSubmitting || !validateForm()) return;

    try {
      setIsSubmitting(true);
      clearMessages();
      setStatusText("Creating your account...");

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim()
        })
      });

      const text = await res.text();
      if (res.ok) {
        setStatusText("Registration successful. Please login.");
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setErrorText(text || "Registration failed");
      }
    } catch (err) {
      setErrorText("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminRegister = async () => {
    if (isSubmitting || !validateForm()) return;

    try {
      setIsSubmitting(true);
      clearMessages();
      setStatusText("Creating admin account...");

      const res = await fetch(`${API_URL}/admin-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim()
        })
      });

      const text = await res.text();
      if (res.ok) {
        setStatusText("Admin registration successful. Please login.");
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setErrorText(text || "Registration failed");
      }
    } catch (err) {
      setErrorText("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const login = async () => {
    if (isSubmitting || !validateForm()) return;

    try {
      setIsSubmitting(true);
      clearMessages();
      setStatusText("Verifying credentials...");

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatusText("Login successful. Redirecting...");
        localStorage.setItem("clientName", data.name);
        localStorage.setItem("clientEmail", data.email);
        setTimeout(() => loginClient(), 500);
      } else {
        const text = await res.text();
        setErrorText(text || "Invalid login");
      }
    } catch (err) {
      setErrorText("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminLogin = async () => {
    if (isSubmitting || !validateForm()) return;

    try {
      setIsSubmitting(true);
      clearMessages();
      setStatusText("Checking admin access...");

      const res = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatusText("Admin login successful. Redirecting...");
        localStorage.setItem("adminName", data.name);
        localStorage.setItem("adminEmail", data.email);
        setTimeout(() => loginAdmin(), 500);
      } else {
        const text = await res.text();
        setErrorText(text || "Invalid admin login");
      }
    } catch (err) {
      setErrorText("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="dual-login">
      <div className="app-title">Voltage HUB</div>

      <div className="login-panel">
        <h2>{isAdminMode ? (isRegister ? "Admin Register" : "Admin Login") : (isRegister ? "Register" : "Client Login")}</h2>

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

        {isAdminMode ? (
          <>
            {isRegister ? (
              <button onClick={adminRegister} disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Register as Admin"}
              </button>
            ) : (
              <button onClick={adminLogin} disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Admin Login"}
              </button>
            )}
          </>
        ) : (
          <>
            {isRegister ? (
              <button onClick={register} disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Register"}
              </button>
            ) : (
              <button onClick={login} disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Client Login"}
              </button>
            )}
          </>
        )}

        {isSubmitting && <div className="auth-progress" />}
        {statusText && <p className="auth-status">{statusText}</p>}
        {errorText && <p className="auth-error">{errorText}</p>}

        <p style={{ cursor: "pointer", marginTop: 10, fontSize: 12 }} onClick={() => {
          if (isSubmitting) return;
          setIsRegister(!isRegister);
          setName("");
          setEmail("");
          setPassword("");
          clearMessages();
        }}>
          {isRegister ? "Already have account? Login" : "New user? Register"}
        </p>

        <hr />

        <button onClick={() => {
          if (isSubmitting) return;
          setIsAdminMode(!isAdminMode);
          setIsRegister(false);
          setName("");
          setEmail("");
          setPassword("");
          clearMessages();
        }}>
          {isAdminMode ? "Switch to Client" : "Switch to Admin"}
        </button>
      </div>
    </div>
  );
}
