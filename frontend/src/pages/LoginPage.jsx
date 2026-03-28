import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE } from "../api";
import "./Auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const cardRef = useRef(null);
  const googleBtnRef = useRef(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" },
    );
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleBtnRef.current) return;

    let cancelled = false;
    let intervalId;

    const mountGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return false;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            setError("Google sign-in failed. Please try again.");
            return;
          }

          setError("");
          setGoogleLoading(true);
          try {
            const res = await axios.post(`${API_BASE}/auth/google`, {
              id_token: response.credential,
            });
            login(res.data.access_token, {
              username: res.data.username,
              email: res.data.email,
            });
            navigate("/");
          } catch (err) {
            setError(
              err.response?.data?.detail ||
                "Google sign-in failed. Please try again.",
            );
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
      return true;
    };

    if (!mountGoogleButton()) {
      intervalId = window.setInterval(() => {
        if (mountGoogleButton()) {
          window.clearInterval(intervalId);
        }
      }, 300);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [login, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // OAuth2PasswordRequestForm requires form-encoded body
      const params = new URLSearchParams();
      params.append("username", form.username);
      params.append("password", form.password);

      const res = await axios.post(`${API_BASE}/auth/login`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      login(res.data.access_token, {
        username: res.data.username,
        email: res.data.email,
      });
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Login failed. Check your credentials.",
      );
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
          <img src="/logo.jpg" alt="" className="auth-logo-img" />
          <h1 className="auth-title">TradePulse</h1>
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
            {loading ? (
              <>
                <span className="btn-spinner" /> Signing in…
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="google-login-wrap">
          {googleLoading && (
            <div className="google-loading-row">
              <span className="btn-spinner btn-spinner-dark" /> Signing in...
            </div>
          )}
          <div ref={googleBtnRef} className="google-btn-slot" />
          {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <p className="google-hint">
              Set VITE_GOOGLE_CLIENT_ID in frontend environment to enable Google
              sign-in.
            </p>
          )}
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
        <p className="auth-footer auth-footer-small">
          Forgot your password? <Link to="/forgot-password">Reset it</Link>
        </p>
      </div>
    </div>
  );
}
