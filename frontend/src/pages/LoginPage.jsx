import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const cardRef = useRef(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }
    );
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // OAuth2PasswordRequestForm requires form-encoded body
      const params = new URLSearchParams();
      params.append("username", form.username);
      params.append("password", form.password);

      const res = await axios.post("http://localhost:8000/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(res.data.access_token, { username: res.data.username, email: res.data.email });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div ref={cardRef} className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-icon">⚡</span>
          <h1 className="auth-title">Trading Signal Bot</h1>
        </div>

        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Signing in…</> : "Sign In →"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
