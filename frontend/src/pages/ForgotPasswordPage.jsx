import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import axios from "axios";
import { API_BASE } from "../api";
import "./Auth.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" },
    );
  }, []);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/auth/forgot-password/request-otp`,
        { email },
      );
      setOtpSent(true);
      setInfo(res.data?.message || "If an account exists, OTP has been sent.");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/forgot-password/reset`, {
        email,
        otp,
        new_password: newPassword,
      });
      setInfo(res.data?.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-glow" />
      <div ref={cardRef} className="auth-card">
        <div className="auth-logo">
          <img src="/logo.jpg" alt="" className="auth-logo-img" />
          <h1 className="auth-title">TradePulse</h1>
        </div>

        <h2 className="auth-heading">Forgot password</h2>
        <p className="auth-sub">
          {otpSent
            ? "Enter OTP and set your new password"
            : "We will send an OTP to your email"}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        {!otpSent ? (
          <form onSubmit={requestOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" /> Sending OTP...
                </>
              ) : (
                "Send OTP ->"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit code"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" /> Resetting...
                </>
              ) : (
                "Reset Password ->"
              )}
            </button>
          </form>
        )}

        <p className="auth-footer">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
