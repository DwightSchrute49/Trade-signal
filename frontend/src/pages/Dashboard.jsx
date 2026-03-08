import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import SignalTable from "../components/SignalTable";
import StockChart from "../components/StockChart";
import { fetchSignals, fetchStockData, fetchReversalAlerts, fetchTopBuys } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const heroRef = useRef(null);
  const panelRef = useRef(null);

  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchSymbol, setSearchSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState("");

  const [reversalAlerts, setReversalAlerts] = useState([]);
  const [bestBuys, setBestBuys] = useState([]);

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

  const loadInsights = useCallback(async () => {
    try {
      const [alerts, opportunities] = await Promise.all([
        fetchReversalAlerts(),
        fetchTopBuys(),
      ]);
      setReversalAlerts(alerts || []);
      setBestBuys(opportunities || []);
    } catch {
      console.error("Could not fetch trading insights");
    }
  }, []);

  const handleSearch = useCallback(async () => {
    let symbol = searchSymbol.trim().toUpperCase();
    if (!symbol) return;
    if (!symbol.endsWith(".NS")) symbol = symbol + ".NS";

    setStockLoading(true);
    setStockError("");
    try {
      const data = await fetchStockData(symbol);
      setStockData(data);
    } catch (err) {
      setStockError(err.response?.status === 404
        ? `Stock "${symbol}" not found.`
        : "Failed to load stock data. Ensure the backend is running.");
      setStockData(null);
    } finally {
      setStockLoading(false);
    }
  }, [searchSymbol]);

  // Initial load + polling every 30s
  useEffect(() => {
    loadSignals();
    const interval = setInterval(loadSignals, 30000);
    return () => clearInterval(interval);
  }, [loadSignals]);

  // Trading insights: fetch every 30s
  useEffect(() => {
    loadInsights();
    const interval = setInterval(loadInsights, 30000);
    return () => clearInterval(interval);
  }, [loadInsights]);

  // Default stock on mount
  useEffect(() => {
    setStockLoading(true);
    fetchStockData("RELIANCE.NS")
      .then((d) => setStockData(d))
      .catch(() => setStockError("Could not load default chart."))
      .finally(() => setStockLoading(false));
  }, []);

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

      {/* Trading Insight Panels */}
      <div className="insight-panels">
        <div className="insight-panel reversal-panel">
          <h3 className="insight-panel-title">⚡ Reversal Alerts</h3>
          <ul className="insight-list">
            {reversalAlerts.map((a) => (
              <li key={a.symbol} className="insight-item">
                <span className="insight-symbol">{a.symbol.replace(".NS", "")}</span>
                <span className="insight-price">Price ₹{a.price}</span>
                <span className={`insight-rsi ${a.rsi < 25 ? "rsi-bright" : "rsi-green"}`}>
                  RSI {a.rsi}
                </span>
                <span className="insight-badge">⚡ Potential Bounce</span>
              </li>
            ))}
            {reversalAlerts.length === 0 && (
              <li className="insight-empty">No reversal alerts</li>
            )}
          </ul>
        </div>
        <div className="insight-panel bestbuy-panel">
          <h3 className="insight-panel-title">🔥 Best Buy Opportunities</h3>
          <ul className="insight-list">
            {bestBuys.map((b) => (
              <li key={b.symbol} className="insight-item">
                <span className="insight-symbol">{b.symbol.replace(".NS", "")}</span>
                <span className="insight-price">Price ₹{b.price}</span>
                <span className="insight-rsi">{b.rsi}</span>
                <span className="insight-badge bullish">📈 Strong Trend</span>
              </li>
            ))}
            {bestBuys.length === 0 && (
              <li className="insight-empty">No best buy opportunities</li>
            )}
          </ul>
        </div>
      </div>

      {/* Hero Stats */}
      <div ref={heroRef} className="hero-section">
        <div className="hero-section-row">
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
          <Link to="/market-screener" className="btn-market-screener">
            ⚡ Market Screener
          </Link>
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
          <div className="search-bar-wrap">
            <div className="search-bar">
              <span className="search-icon">🔎</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search NSE Stock"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button
                type="button"
                className="search-btn"
                onClick={handleSearch}
                disabled={stockLoading}
              >
                {stockLoading ? "Searching…" : "Search"}
              </button>
            </div>
          </div>
          <StockChart
            stockData={stockData}
            loading={stockLoading}
            error={stockError}
          />
        </div>
      </div>
    </div>
  );
}
