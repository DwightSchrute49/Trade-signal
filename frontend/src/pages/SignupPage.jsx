import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE } from "../api";
import "./Auth.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const cardRef = useRef(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" },
    );
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!otpSent) {
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
        await axios.post(`${API_BASE}/auth/register/request-otp`, {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        setOtpSent(true);
        setInfo("OTP sent to your email. Enter it below to finish signup.");
      } catch (err) {
        setError(
          err.response?.data?.detail || "Could not send OTP. Please try again.",
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register/verify-otp`, {
        username: form.username,
        email: form.email,
        password: form.password,
        otp,
      });
      login(res.data.access_token, {
        username: res.data.username,
        email: res.data.email,
      });
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "OTP verification failed. Please try again.",
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

        <h2 className="auth-heading">Create account</h2>
        <p className="auth-sub">Start trading smarter today</p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

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
              disabled={otpSent}
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
              disabled={otpSent}
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
                disabled={otpSent}
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
                disabled={otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <div className="form-group">
              <label htmlFor="otp">Email OTP</label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
            </div>
          )}

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? (
              <>
                <span className="btn-spinner" />{" "}
                {otpSent ? "Verifying OTP..." : "Sending OTP..."}
              </>
            ) : otpSent ? (
              "Verify OTP & Create Account ->"
            ) : (
              "Send OTP ->"
            )}
          </button>

          {otpSent && (
            <button
              type="button"
              className="btn-auth btn-auth-secondary"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError("");
                setInfo("");
                try {
                  await axios.post(`${API_BASE}/auth/register/request-otp`, {
                    username: form.username,
                    email: form.email,
                    password: form.password,
                  });
                  setInfo("A fresh OTP has been sent to your email.");
                } catch (err) {
                  setError(
                    err.response?.data?.detail || "Could not resend OTP.",
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Resend OTP
            </button>
          )}
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
