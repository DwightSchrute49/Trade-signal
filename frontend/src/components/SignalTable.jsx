import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./SignalTable.css";

const SIGNAL_BG = {
  BUY: "rgba(34, 197, 94, 0.08)",
  SELL: "rgba(239, 68, 68, 0.08)",
  HOLD: "rgba(255,255,255,0.03)",
};

const SIGNAL_COLOR = {
  BUY: "#22c55e",
  SELL: "#ef4444",
  HOLD: "#888",
};

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function SignalBadge({ type }) {
  return (
    <span
      className="signal-badge"
      style={{
        color: SIGNAL_COLOR[type] || "#888",
        borderColor: SIGNAL_COLOR[type] || "#333",
        background: SIGNAL_BG[type] || "transparent",
        boxShadow: type === "BUY"
          ? "0 0 10px rgba(34, 197, 94, 0.3)"
          : type === "SELL"
          ? "0 0 10px rgba(239, 68, 68, 0.3)"
          : "none",
      }}
    >
      {type === "BUY" ? "▲ BUY" : type === "SELL" ? "▼ SELL" : "— HOLD"}
    </span>
  );
}

export default function SignalTable({ signals, loading }) {
  const tableRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll(".signal-row");
    if (rows.length > prevCountRef.current) {
      gsap.fromTo(
        rows,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" }
      );
    }
    prevCountRef.current = rows.length;
  }, [signals]);

  if (loading) {
    return (
      <div className="table-wrap">
        <div className="skeleton-header" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="table-wrap" ref={tableRef}>
      <table className="signal-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price (₹)</th>
            <th>RSI</th>
            <th>EMA50</th>
            <th>EMA200</th>
            <th>Signal</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {signals.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-row">
                No signals yet — click <strong>Scan Now</strong> to generate signals.
              </td>
            </tr>
          ) : (
            signals.map((s) => (
              <tr
                key={s.id}
                className="signal-row"
                style={{ background: SIGNAL_BG[s.signal] || "transparent" }}
              >
                <td className="symbol-cell">{s.symbol}</td>
                <td>{s.price?.toFixed(2)}</td>
                <td className="rsi-cell" style={{ color: s.rsi < 30 ? "#22c55e" : s.rsi > 70 ? "#ef4444" : "#aaa" }}>
                  {s.rsi?.toFixed(1)}
                </td>
                <td className="muted">{s.ema50 ? s.ema50.toFixed(1) : "—"}</td>
                <td className="muted">{s.ema200 ? s.ema200.toFixed(1) : "—"}</td>
                <td><SignalBadge type={s.signal} /></td>
                <td className="time-cell">{formatTime(s.timestamp)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
