import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { triggerScan } from "../api";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar({ onScanComplete }) {
  const navRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setScanMsg("");
    try {
      const res = await triggerScan();
      setScanMsg(`✅ Scanned ${res.scanned} stocks`);
      if (onScanComplete) onScanComplete();
    } catch {
      setScanMsg("❌ Scan failed — is the backend running?");
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(""), 4000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav ref={navRef} className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">⚡</span>
        <span className="brand-title">Trading Signal Bot</span>
        <span className="brand-tag">NSE Live</span>
      </div>

      <div className="navbar-center">
        {scanMsg && <span className="scan-msg">{scanMsg}</span>}
      </div>

      <div className="navbar-actions">
        <button
          className={`btn-scan ${scanning ? "scanning" : ""}`}
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <><span className="spinner" /> Scanning…</>
          ) : (
            "🔍 Scan Now"
          )}
        </button>

        {user && (
          <div className="user-chip">
            <span className="user-avatar">{user.username?.[0]?.toUpperCase()}</span>
            <span className="user-name">{user.username}</span>
            <button className="btn-logout" onClick={handleLogout} title="Sign out">
              ↩
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
