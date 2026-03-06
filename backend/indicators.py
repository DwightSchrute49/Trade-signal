import yfinance as yf
import pandas as pd
import ta


def calculate_indicators(symbol: str, interval: str = "5m", period: str = "5d") -> dict | None:
    """
    Download OHLCV data for a symbol and compute RSI, EMA50, EMA200.
    Returns a dict with the latest values, or None on failure.
    """
    try:
        df = yf.download(symbol, interval=interval, period=period, progress=False, auto_adjust=True)

        if df.empty or len(df) < 20:
            print(f"⚠️  Not enough data for {symbol}")
            return None

        # Flatten multi-level columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        close = df["Close"].dropna()

        # RSI (14 periods)
        rsi_series = ta.momentum.RSIIndicator(close=close, window=14).rsi()

        # EMAs
        ema50_series = ta.trend.EMAIndicator(close=close, window=50).ema_indicator()
        ema200_series = ta.trend.EMAIndicator(close=close, window=200).ema_indicator()

        latest_price = float(close.iloc[-1])
        latest_rsi = float(rsi_series.iloc[-1]) if not rsi_series.empty else None
        latest_ema50 = float(ema50_series.iloc[-1]) if not ema50_series.empty else None
        latest_ema200 = float(ema200_series.iloc[-1]) if not ema200_series.empty else None

        # Build chart data (last 100 candles)
        chart_df = df.tail(100).copy()
        chart_data = []
        for ts, row in chart_df.iterrows():
            chart_data.append({
                "time": ts.isoformat(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
            })

        # Add RSI to chart data
        rsi_chart = []
        ema50_chart = []
        ema200_chart = []
        for ts in chart_df.index:
            rsi_val = rsi_series.get(ts)
            ema50_val = ema50_series.get(ts)
            ema200_val = ema200_series.get(ts)
            rsi_chart.append({"time": ts.isoformat(), "value": round(float(rsi_val), 2) if rsi_val is not None and not pd.isna(rsi_val) else None})
            ema50_chart.append({"time": ts.isoformat(), "value": round(float(ema50_val), 2) if ema50_val is not None and not pd.isna(ema50_val) else None})
            ema200_chart.append({"time": ts.isoformat(), "value": round(float(ema200_val), 2) if ema200_val is not None and not pd.isna(ema200_val) else None})

        return {
            "symbol": symbol,
            "price": round(latest_price, 2),
            "rsi": round(latest_rsi, 2) if latest_rsi is not None else None,
            "ema50": round(latest_ema50, 2) if latest_ema50 is not None else None,
            "ema200": round(latest_ema200, 2) if latest_ema200 is not None else None,
            "chart": chart_data,
            "rsi_chart": rsi_chart,
            "ema50_chart": ema50_chart,
            "ema200_chart": ema200_chart,
        }

    except Exception as e:
        print(f"❌ Error calculating indicators for {symbol}: {e}")
        return None
