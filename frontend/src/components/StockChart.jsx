import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./StockChart.css";

ChartJS.register(
  LineElement, PointElement, LinearScale, TimeScale,
  CategoryScale, Title, Tooltip, Legend, Filler
);

function buildPriceChart(data) {
  const labels = data.chart.map((d) => {
    const t = new Date(d.time);
    return t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  });
  const close = data.chart.map((d) => d.close);
  const ema50 = data.ema50_chart.map((d) => d.value);
  const ema200 = data.ema200_chart.map((d) => d.value);

  return {
    labels,
    datasets: [
      {
        label: "Price",
        data: close,
        borderColor: "#d4a017",
        backgroundColor: "rgba(212,160,23,0.08)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: true,
      },
      {
        label: "EMA 50",
        data: ema50,
        borderColor: "#3b82f6",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "EMA 200",
        data: ema200,
        borderColor: "#a855f7",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ],
  };
}

function buildRsiChart(data) {
  const labels = data.rsi_chart.map((d) => {
    const t = new Date(d.time);
    return t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  });
  const rsi = data.rsi_chart.map((d) => d.value);

  return {
    labels,
    datasets: [
      {
        label: "RSI",
        data: rsi,
        borderColor: "#f472b6",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ],
  };
}

const chartOptions = (title, minY, maxY) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: "easeInOutQuart" },
  plugins: {
    legend: {
      labels: { color: "#888", font: { size: 11 } },
    },
    title: {
      display: true,
      text: title,
      color: "#888",
      font: { size: 12 },
    },
    tooltip: {
      backgroundColor: "#111",
      borderColor: "#252525",
      borderWidth: 1,
      titleColor: "#d4a017",
      bodyColor: "#ccc",
    },
  },
  scales: {
    x: {
      ticks: { color: "#555", maxTicksLimit: 8, font: { size: 10 } },
      grid: { color: "#111" },
    },
    y: {
      ticks: { color: "#888", font: { size: 10 } },
      grid: { color: "#141414" },
      min: minY,
      max: maxY,
    },
  },
});

const signalColors = { BUY: "#22c55e", SELL: "#ef4444", HOLD: "#888" };

export default function StockChart({ stockData, loading, error }) {
  const chartRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      chartRef.current,
      { x: 30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  const rsiNow = stockData?.rsi;
  const rsiColor = rsiNow < 30 ? "#22c55e" : rsiNow > 70 ? "#ef4444" : "#f472b6";
  const displaySymbol = stockData?.symbol?.replace(".NS", "") ?? "";

  return (
    <div ref={chartRef} className="chart-panel">
      {/* Header */}
      <div className="chart-header">
        <div className="chart-title-row">
          <h3 className="chart-title">📈 Stock Chart</h3>
          {stockData && (
            <div className="chart-meta">
              <span className="price-tag">₹{stockData.price?.toFixed(2)}</span>
              <span className="rsi-tag" style={{ color: rsiColor }}>
                RSI {stockData.rsi?.toFixed(1)}
              </span>
              {stockData.ema50 != null && (
                <span className="indicator-tag">EMA50 {stockData.ema50?.toFixed(2)}</span>
              )}
              {stockData.ema200 != null && (
                <span className="indicator-tag">EMA200 {stockData.ema200?.toFixed(2)}</span>
              )}
              {stockData.signal && (
                <span
                  className="signal-tag"
                  style={{ color: signalColors[stockData.signal] ?? "#888" }}
                >
                  {stockData.signal}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart body */}
      <div className="chart-body">
        {loading && (
          <div className="chart-loading">
            <div className="chart-spinner" />
            <p>Loading chart data…</p>
          </div>
        )}
        {error && !loading && <p className="chart-error">{error}</p>}

        {!loading && !error && stockData && (
          <>
            {/* Price chart */}
            <div className="chart-area price-chart">
              <Line
                data={buildPriceChart(stockData)}
                options={chartOptions(`${displaySymbol} — Price with EMA50 & EMA200`, undefined, undefined)}
              />
            </div>

            {/* RSI chart */}
            <div className="chart-area rsi-chart">
              <Line
                data={buildRsiChart(stockData)}
                options={{
                  ...chartOptions("RSI (14)", 0, 100),
                  plugins: {
                    ...chartOptions("RSI (14)", 0, 100).plugins,
                    annotation: undefined,
                  },
                }}
              />
              <div className="rsi-levels">
                <span className="rsi-line-label overbought">Overbought 70</span>
                <span className="rsi-line-label oversold">Oversold 30</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
