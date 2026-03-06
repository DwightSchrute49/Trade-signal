import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import SignalTable from "../components/SignalTable";
import StockChart from "../components/StockChart";
import { fetchSignals } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const heroRef = useRef(null);
  const panelRef = useRef(null);

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const buyCount = signals.filter((s) => s.signal === "BUY").length;
  const sellCount = signals.filter((s) => s.signal === "SELL").length;
  const holdCount = signals.filter((s) => s.signal === "HOLD").length;

  const loadSignals = useCallback(async () => {
    try {
      const data = await fetchSignals(50);
      setSignals(data);
    } catch {
      console.error("Could not fetch signals");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling every 30s
  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 30000);
    return () => clearInterval(interval);
  }, [loadSignals]);

  // GSAP page entrance
  useEffect(() => {
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 }
    );
  }, []);

  return (
    <div className="dashboard">
      <Navbar onScanComplete={loadSignals} />

      {/* Hero Stats */}
      <div ref={heroRef} className="hero-section">
        <div className="stat-cards">
          <div className="stat-card total">
            <span className="stat-num">{signals.length}</span>
            <span className="stat-label">Total Signals</span>
          </div>
          <div className="stat-card buy">
            <span className="stat-num">{buyCount}</span>
            <span className="stat-label">▲ BUY</span>
          </div>
          <div className="stat-card sell">
            <span className="stat-num">{sellCount}</span>
            <span className="stat-label">▼ SELL</span>
          </div>
          <div className="stat-card hold">
            <span className="stat-num">{holdCount}</span>
            <span className="stat-label">— HOLD</span>
          </div>
        </div>
      </div>

      {/* Main panels */}
      <div ref={panelRef} className="main-grid">
        {/* Left — Signals Panel */}
        <div className="column-left">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">⚡ Live Signals</h2>
              <span className="live-dot" />
              <span className="live-text">Auto-refreshes every 30s</span>
            </div>
            <SignalTable signals={signals} loading={loading} />
          </div>
        </div>

        {/* Right — Chart Panel */}
        <div className="column-right">
          <StockChart />
        </div>
      </div>
    </div>
  );
}
