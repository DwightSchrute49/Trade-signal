import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchTopBuys } from "../api";
import "./BestBuyOpportunitiesPage.css";

export default function BestBuyOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState([]);

  const loadOpportunities = useCallback(async () => {
    try {
      const data = await fetchTopBuys();
      setOpportunities(data || []);
    } catch {
      console.error("Could not fetch best buy opportunities");
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
    const interval = setInterval(loadOpportunities, 30000);
    return () => clearInterval(interval);
  }, [loadOpportunities]);

  return (
    <div className="bestbuy-page">
      <Navbar />

      <div className="bestbuy-page-header">
        <Link to="/" className="bestbuy-back-link">← Dashboard</Link>
        <h1 className="bestbuy-page-title">🔥 Best Buy Opportunities</h1>
        <span className="bestbuy-refresh-note">Auto-refreshes every 30s</span>
      </div>

      <div className="bestbuy-panel">
        <p className="bestbuy-desc">Strong bullish setups — RSI 40–60, EMA50 &gt; EMA200.</p>
        <ul className="bestbuy-list">
          {opportunities.map((b) => (
            <li key={b.symbol} className="bestbuy-item">
              <span className="bestbuy-symbol">{b.symbol.replace(".NS", "")}</span>
              <span className="bestbuy-price">Price ₹{b.price}</span>
              <span className="bestbuy-rsi">RSI {b.rsi}</span>
              <span className="bestbuy-badge">📈 Strong Trend</span>
            </li>
          ))}
          {opportunities.length === 0 && (
            <li className="bestbuy-empty">No best buy opportunities</li>
          )}
        </ul>
      </div>
    </div>
  );
}
