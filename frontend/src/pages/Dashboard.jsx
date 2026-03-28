import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import SignalTable from "../components/SignalTable";
import StockChart from "../components/StockChart";
import { fetchSignals, fetchStockData } from "../api";
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

  // Stats
  const totalCount = signals.length;
  const buyCount = signals.filter((s) => s.signal === "BUY").length;
  const sellCount = signals.filter((s) => s.signal === "SELL").length;
  const holdCount = signals.filter((s) => s.signal === "HOLD").length;
  const buyPct = totalCount ? Math.round((buyCount / totalCount) * 100) : 0;
  const sellPct = totalCount ? Math.round((sellCount / totalCount) * 100) : 0;
  const holdPct = totalCount ? Math.round((holdCount / totalCount) * 100) : 0;

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
      setStockError(
        err.response?.status === 404
          ? `Stock "${symbol}" not found.`
          : "Failed to load stock data. Ensure the backend is running.",
      );
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
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
    );
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.3 },
    );
  }, []);

  return (
    <div className="dashboard">
      <Navbar onScanComplete={loadSignals} />

      {/* Hero Stats */}
      <div ref={heroRef} className="hero-section">
        <div className="hero-section-row">
          <div className="stat-cards">
            <div className="stat-card total">
              <span className="stat-label">Total Signals</span>
              <span className="stat-num">{totalCount}</span>
              <span className="stat-sub">Rolling live snapshot</span>
            </div>
            <div className="stat-card buy">
              <span className="stat-label">Buy</span>
              <span className="stat-num">{buyCount}</span>
              <span className="stat-sub">{buyPct}% of tracked signals</span>
            </div>
            <div className="stat-card sell">
              <span className="stat-label">Sell</span>
              <span className="stat-num">{sellCount}</span>
              <span className="stat-sub">{sellPct}% of tracked signals</span>
            </div>
            <div className="stat-card hold">
              <span className="stat-label">Hold</span>
              <span className="stat-num">{holdCount}</span>
              <span className="stat-sub">{holdPct}% of tracked signals</span>
            </div>
          </div>
          <div className="hero-buttons">
            <Link
              to="/reversal-alerts"
              className="btn-market-screener btn-reversal"
            >
              Reversal Alerts
            </Link>
            <Link to="/best-buys" className="btn-market-screener btn-bestbuy">
              Best Buy Setups
            </Link>
            <Link to="/market-screener" className="btn-market-screener">
              Market Screener
            </Link>
          </div>
        </div>
      </div>

      {/* Main panels */}
      <div ref={panelRef} className="main-grid">
        {/* Left — Signals Panel */}
        <div className="column-left">
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Live Signals</h2>
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
              <span className="search-icon">Search</span>
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
