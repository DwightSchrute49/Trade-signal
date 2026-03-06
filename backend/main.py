from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

from database import get_db, SessionLocal
from models import Signal, create_tables
from scanner import scan_stocks, SYMBOLS
from indicators import calculate_indicators
from auth import router as auth_router


# ── Scheduler ────────────────────────────────────────────────────────────────
scheduler = BackgroundScheduler()


def scheduled_scan():
    db = SessionLocal()
    try:
        print("⏰ Scheduled scan running...")
        scan_stocks(db)
    finally:
        db.close()


# ── App lifespan ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    scheduler.add_job(scheduled_scan, "interval", minutes=5, id="stock_scan")
    scheduler.start()
    print("🚀 Scheduler started — scanning every 5 minutes.")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Trading Signal Bot",
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
    return {"status": "ok", "message": "Trading Signal Bot API is running 🚀"}


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
    return data


@app.post("/scan")
def manual_scan(db: Session = Depends(get_db)):
    print("🔄 Manual scan triggered via API...")
    results = scan_stocks(db)
    return {"status": "success", "scanned": len(results), "signals": results}


@app.get("/symbols")
def list_symbols():
    return {"symbols": SYMBOLS}
