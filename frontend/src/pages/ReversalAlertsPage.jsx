import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchReversalAlerts } from "../api";
import "./ReversalAlertsPage.css";

export default function ReversalAlertsPage() {
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchReversalAlerts();
      setAlerts(data || []);
    } catch {
      console.error("Could not fetch reversal alerts");
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  return (
    <div className="reversal-alerts-page">
      <Navbar />

      <div className="alerts-page-header">
        <Link to="/" className="alerts-back-link">
          ← Dashboard
        </Link>
        <h1 className="alerts-page-title">Reversal Alerts</h1>
        <span className="alerts-refresh-note">Auto-refreshes every 30s</span>
      </div>

      <div className="alerts-panel">
        <p className="alerts-desc">
          Oversold stocks near support — potential bounce candidates.
        </p>
        <ul className="alerts-list">
          {alerts.map((a) => (
            <li key={a.symbol} className="alerts-item">
              <span className="alerts-symbol">
                {a.symbol.replace(".NS", "")}
              </span>
              <span className="alerts-price">Price ₹{a.price}</span>
              <span
                className={`alerts-rsi ${a.rsi < 25 ? "rsi-bright" : "rsi-green"}`}
              >
                RSI {a.rsi}
              </span>
              <span className="alerts-badge">Potential Bounce</span>
            </li>
          ))}
          {alerts.length === 0 && (
            <li className="alerts-empty">No reversal alerts</li>
          )}
        </ul>
      </div>
    </div>
  );
}
