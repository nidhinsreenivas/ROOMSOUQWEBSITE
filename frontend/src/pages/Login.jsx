import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:8000";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const csrfResponse = await fetch(`${API_URL}/api/csrf/`, {
        credentials: "include",
      });

      if (!csrfResponse.ok) {
        throw new Error("Unable to initialize secure login.");
      }

      const csrfData = await csrfResponse.json();

      const response = await fetch(
        `${API_URL}/api/properties/admin/login/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfData.csrfToken,
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      navigate("/admin");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to Django. Check that the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <Link to="/" className="logo">
          Room<span>Souq</span>
        </Link>

        <span className="section-label">WELCOME BACK</span>
        <h1>Admin Login</h1>
        <p>Sign in to manage Room Souq listings.</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button className="login-submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <Link to="/" className="login-back">
          ← Back to homepage
        </Link>
      </form>
    </main>
  );
}

export default Login;