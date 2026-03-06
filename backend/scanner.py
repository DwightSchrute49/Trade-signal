from indicators import calculate_indicators
from strategy import evaluate_signal
from models import Signal


SYMBOLS = [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
]


def scan_stocks(db) -> list[dict]:
    """
    Scan all configured symbols, evaluate signals, and persist to DB.
    Returns list of generated signal dicts.
    """
    results = []

    for symbol in SYMBOLS:
        print(f"🔍 Scanning {symbol}...")
        data = calculate_indicators(symbol)

        if data is None:
            continue

        signal_type = evaluate_signal(data["rsi"], data["price"], data["ema200"])

        # Persist signal (including HOLD so history is visible)
        db_signal = Signal(
            symbol=symbol,
            price=data["price"],
            rsi=data["rsi"] if data["rsi"] is not None else 0.0,
            ema50=data.get("ema50"),
            ema200=data.get("ema200"),
            signal=signal_type,
        )
        db.add(db_signal)
        db.commit()
        db.refresh(db_signal)

        results.append({
            "id": db_signal.id,
            "symbol": symbol,
            "price": data["price"],
            "rsi": data["rsi"],
            "ema50": data.get("ema50"),
            "ema200": data.get("ema200"),
            "signal": signal_type,
            "timestamp": db_signal.timestamp.isoformat() if db_signal.timestamp else None,
        })

        print(f"   ✅ {symbol} → price={data['price']} rsi={data['rsi']} signal={signal_type}")

    return results
