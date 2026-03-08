import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { fetchMarketScan } from "../api";
import "./MarketScreenerPage.css";

export default function MarketScreenerPage() {
  const [marketScan, setMarketScan] = useState({ buy: [], sell: [], hold: [] });

  const loadMarketScan = useCallback(async () => {
    try {
      const data = await fetchMarketScan();
      setMarketScan(data);
    } catch {
      console.error("Could not fetch market scan");
    }
  }, []);

  useEffect(() => {
    loadMarketScan();
    const interval = setInterval(loadMarketScan, 30000);
    return () => clearInterval(interval);
  }, [loadMarketScan]);

  return (
    <div className="market-screener-page">
      <Navbar />

      <div className="screener-page-header">
        <Link to="/" className="screener-back-link">← Dashboard</Link>
        <h1 className="screener-page-title">⚡ Market Screener</h1>
        <span className="screener-refresh-note">Auto-refreshes every 30s</span>
      </div>

      <div className="market-screener">
        <div className="screener-columns">
          <div className="screener-col buy-col">
            <h3 className="screener-col-title">BUY</h3>
            <ul className="screener-list">
              {marketScan.buy.map((s) => (
                <li key={s.symbol} className="screener-item">
                  <span className="screener-symbol">{s.symbol.replace(".NS", "")}</span>
                  <span className="screener-meta">₹{s.price} · RSI {s.rsi}</span>
                </li>
              ))}
              {marketScan.buy.length === 0 && (
                <li className="screener-empty">—</li>
              )}
            </ul>
          </div>
          <div className="screener-col sell-col">
            <h3 className="screener-col-title">SELL</h3>
            <ul className="screener-list">
              {marketScan.sell.map((s) => (
                <li key={s.symbol} className="screener-item">
                  <span className="screener-symbol">{s.symbol.replace(".NS", "")}</span>
                  <span className="screener-meta">₹{s.price} · RSI {s.rsi}</span>
                </li>
              ))}
              {marketScan.sell.length === 0 && (
                <li className="screener-empty">—</li>
              )}
            </ul>
          </div>
          <div className="screener-col hold-col">
            <h3 className="screener-col-title">HOLD</h3>
            <ul className="screener-list">
              {marketScan.hold.map((s) => (
                <li key={s.symbol} className="screener-item">
                  <span className="screener-symbol">{s.symbol.replace(".NS", "")}</span>
                  <span className="screener-meta">₹{s.price} · RSI {s.rsi}</span>
                </li>
              ))}
              {marketScan.hold.length === 0 && (
                <li className="screener-empty">—</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
