# 📈 Trading Signal Bot

A modern full-stack stock trading dashboard that generates BUY/SELL signals for NSE (Indian market) stocks using technical indicators.

**Theme:** Black + Dark Gold | **Stack:** FastAPI + React/Vite + Neon PostgreSQL

---

## 🗂 Project Structure

```
TradingBot/
├── backend/
│   ├── main.py          # FastAPI app + routes
│   ├── database.py      # DB connection (Neon/SQLite fallback)
│   ├── models.py        # SQLAlchemy Signal model
│   ├── indicators.py    # RSI, EMA50, EMA200 via yfinance + ta
│   ├── strategy.py      # BUY/SELL/HOLD logic
│   ├── scanner.py       # Stock scanner + APScheduler
│   ├── requirements.txt
│   └── .env.example     # Copy to .env and fill in your DB URL
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── SignalTable.jsx
        │   └── StockChart.jsx
        └── pages/
            └── Dashboard.jsx
```

---

## ⚙️ Backend Setup

### 1. Create a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure database (optional)

Copy `.env.example` to `.env` and add your **Neon PostgreSQL** connection string:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

> If you skip this, the app uses a local `signals.db` SQLite file automatically.

### 4. Start the backend

```bash
uvicorn main:app --reload
```

Backend runs at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

---

## 🖥️ Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/signals?limit=50` | Latest signals from DB |
| `GET` | `/stock/{symbol}` | Chart data for a symbol |
| `POST` | `/scan` | Trigger a manual scan |
| `GET` | `/symbols` | List of tracked symbols |

---

## 📊 Signal Strategy

| Condition | Signal |
|-----------|--------|
| RSI < 30 **AND** Price > EMA200 | ✅ **BUY** |
| RSI > 70 | 🔴 **SELL** |
| Everything else | ⚪ HOLD |

---

## 🎯 Tracked Symbols

- `RELIANCE.NS`
- `TCS.NS`
- `INFY.NS`
- `HDFCBANK.NS`

> The backend scans all symbols **every 5 minutes** automatically.
> You can also trigger a manual scan from the UI via the **"Scan Now"** button.

---

## 🧩 Features

- **Live Signals Table** — color-coded BUY/SELL rows, auto-refreshes every 30s
- **Stock Charts** — Price line with EMA50/EMA200 overlays + RSI chart
- **GSAP Animations** — Navbar slide-in, signal stagger, chart slide
- **Stat Cards** — Total / BUY / SELL / HOLD counters
- **Responsive** — Works on desktop and mobile
