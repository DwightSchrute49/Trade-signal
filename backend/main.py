from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from database import get_db, SessionLocal
from models import Signal, create_tables
from scanner import scan_stocks, SYMBOLS
from indicators import calculate_indicators
from strategy import evaluate_signal
from auth import router as auth_router


# ── Scheduler ────────────────────────────────────────────────────────────────
scheduler = BackgroundScheduler()


def scheduled_scan():
    db = SessionLocal()
    try:
        print("[SCAN] Scheduled scan running...")
        scan_stocks(db)
    finally:
        db.close()


# ── App lifespan ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    scheduler.add_job(scheduled_scan, "interval", minutes=5, id="stock_scan")
    scheduler.start()
    print("[START] Scheduler started -- scanning every 5 minutes.")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="TradePulse",
    description="Stock market BUY/SELL signal generator",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "TradePulse API is running 🚀"}


@app.get("/signals")
def get_signals(limit: int = 50, db: Session = Depends(get_db)):
    signals = (
        db.query(Signal)
        .order_by(Signal.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": s.id,
            "symbol": s.symbol,
            "price": s.price,
            "rsi": round(s.rsi, 2),
            "ema50": round(s.ema50, 2) if s.ema50 else None,
            "ema200": round(s.ema200, 2) if s.ema200 else None,
            "signal": s.signal,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
        }
        for s in signals
    ]


@app.get("/stock/{symbol:path}")
def get_stock_data(symbol: str, db: Session = Depends(get_db)):
    data = calculate_indicators(symbol)
    if data is None:
        raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
    signal_type = evaluate_signal(
        data.get("rsi"), data.get("price"), data.get("ema200")
    )
    data["signal"] = signal_type
    return data


@app.post("/scan")
def manual_scan(db: Session = Depends(get_db)):
    print("[SCAN] Manual scan triggered via API...")
    results = scan_stocks(db)
    return {"status": "success", "scanned": len(results), "signals": results}


@app.get("/symbols")
def list_symbols():
    return {"symbols": SYMBOLS}


@app.get("/market-scan")
def market_scan(db: Session = Depends(get_db)):
    """
    Get latest signal per stock symbol, grouped by BUY / SELL / HOLD.
    """
    all_signals = (
        db.query(Signal)
        .order_by(Signal.timestamp.desc())
        .limit(5000)
        .all()
    )

    seen = {}
    for s in all_signals:
        if s.symbol not in seen:
            seen[s.symbol] = s

    buy = []
    sell = []
    hold = []

    for s in seen.values():
        item = {"symbol": s.symbol, "price": round(s.price, 2), "rsi": round(s.rsi, 2)}
        if s.signal == "BUY":
            buy.append(item)
        elif s.signal == "SELL":
            sell.append(item)
        else:
            hold.append(item)

    return {"buy": buy, "sell": sell, "hold": hold}


def _get_latest_signals(db: Session):
    """Get latest signal per stock symbol."""
    all_signals = (
        db.query(Signal)
        .order_by(Signal.timestamp.desc())
        .limit(5000)
        .all()
    )
    seen = {}
    for s in all_signals:
        if s.symbol not in seen:
            seen[s.symbol] = s
    return seen


@app.get("/reversal-alerts")
def reversal_alerts(db: Session = Depends(get_db)):
    """
    Detect oversold stocks near support (RSI < 30, price within 3% of EMA50 or EMA200).
    Returns top 5 sorted by lowest RSI.
    """
    latest = _get_latest_signals(db)
    candidates = []

    for s in latest.values():
        if s.rsi is None or s.rsi >= 30:
            continue

        near_ema50 = False
        near_ema200 = False

        if s.ema50 is not None:
            if 0.97 * s.ema50 <= s.price <= 1.03 * s.ema50:
                near_ema50 = True
        if s.ema200 is not None:
            if 0.97 * s.ema200 <= s.price <= 1.03 * s.ema200:
                near_ema200 = True

        if near_ema50 or near_ema200:
            candidates.append(s)

    candidates.sort(key=lambda x: x.rsi)
    top5 = candidates[:5]

    return {
        "alerts": [
            {
                "symbol": s.symbol,
                "price": round(s.price, 2),
                "rsi": round(s.rsi, 2),
                "type": "REVERSAL",
            }
            for s in top5
        ]
    }


@app.get("/top-buys")
def top_buys(db: Session = Depends(get_db)):
    """
    Detect strong bullish setups: RSI 40-60, EMA50 > EMA200, price > EMA50.
    Returns top 5 sorted by highest RSI.
    """
    latest = _get_latest_signals(db)
    candidates = []

    for s in latest.values():
        if s.rsi is None or s.ema50 is None or s.ema200 is None:
            continue

        if not (40 <= s.rsi <= 60):
            continue
        if s.ema50 <= s.ema200:
            continue
        if s.price <= s.ema50:
            continue

        candidates.append(s)

    candidates.sort(key=lambda x: x.rsi, reverse=True)
    top5 = candidates[:5]

    return {
        "opportunities": [
            {
                "symbol": s.symbol,
                "price": round(s.price, 2),
                "rsi": round(s.rsi, 2),
                "type": "BEST_BUY",
            }
            for s in top5
        ]
    }
