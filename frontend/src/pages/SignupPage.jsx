import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "./Auth.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const cardRef = useRef(null);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
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
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      login(res.data.access_token, { username: res.data.username, email: res.data.email });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-sub">Start trading smarter today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Creating account…</> : "Create Account →"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
