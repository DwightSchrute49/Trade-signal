# TradePulse

TradePulse is a full-stack stock monitoring and signal platform with a FastAPI backend and a React + Vite frontend. It provides indicator-based signals, market scans, account authentication, OTP email flows, and Google sign-in.

## Features

- Authentication with username and password
- Signup with OTP verification over email
- Forgot password flow with OTP reset
- Google sign-in using Google Identity Services
- Live signal feed with BUY, SELL, and HOLD classifications
- Symbol-specific chart and indicator data endpoints
- Market scan, reversal alerts, and top buy opportunity endpoints
- Automated background scanning every 5 minutes
- Manual scan trigger from API and UI
- PostgreSQL support (Neon) with SQLite fallback for local development

## Tech Stack

- Backend: FastAPI, SQLAlchemy, APScheduler
- Frontend: React, Vite, Axios, Chart.js, GSAP
- Auth: JWT, OTP-based email verification, Google ID token verification
- Email: Nodemailer (invoked from backend via Node script)

## Project Structure

```text
TradingBot/
    backend/
        auth.py
        database.py
        email_service.py
        indicators.py
        mailer.js
        main.py
        models.py
        scanner.py
        strategy.py
        requirements.txt
    frontend/
        src/
            components/
            context/
            pages/
        package.json
    start_backend.bat
    package.json
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Environment Configuration

### Backend environment (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and configure:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
SECRET_KEY=replace_with_a_strong_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com

SMTP_EMAIL=your_sender_email
SMTP_PASSWORD=your_email_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
OTP_EXPIRY_MINUTES=10
```

Notes:

- If `DATABASE_URL` is missing, backend falls back to local SQLite (`signals.db`).
- `GOOGLE_CLIENT_ID` must match the frontend Google client ID.
- OTP email delivery requires SMTP credentials.

### Frontend environment (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` and configure:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
```

## Installation

### 1. Install root dependencies

From the repository root:

```bash
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Set up backend Python environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## Run the Application

### Option A: Start backend and frontend together

From repository root:

```bash
npm run dev
```

This runs:

- Backend on `http://localhost:8000`
- Frontend on `http://localhost:5173`

### Option B: Start services separately

Backend:

```bash
start_backend.bat
```

Frontend:

```bash
cd frontend
npm run dev
```

## API Overview

Core routes:

- `GET /` - health check
- `GET /signals?limit=50` - latest signals
- `GET /stock/{symbol}` - indicator and signal data for one symbol
- `POST /scan` - trigger manual scan
- `GET /symbols` - tracked symbols
- `GET /market-scan` - grouped latest market scan results
- `GET /reversal-alerts` - oversold reversal candidates
- `GET /top-buys` - bullish opportunity candidates

Authentication routes:

- `POST /auth/register/request-otp`
- `POST /auth/register/verify-otp`
- `POST /auth/forgot-password/request-otp`
- `POST /auth/forgot-password/reset`
- `POST /auth/login`
- `POST /auth/google`
- `GET /auth/me`

Interactive API docs are available at:

- `http://localhost:8000/docs`

## Default Scan Universe

The scanner tracks configured symbols in `backend/scanner.py` and runs every 5 minutes using APScheduler.

## Troubleshooting

- OTP appears sent but no email received:
  - Confirm `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_HOST`, and `SMTP_PORT` in `backend/.env`.
  - For Gmail, use an App Password.
- Google sign-in reports not configured:
  - Set both `backend/.env` `GOOGLE_CLIENT_ID` and `frontend/.env` `VITE_GOOGLE_CLIENT_ID`.
  - Ensure Google OAuth Authorized JavaScript origin includes your frontend URL.
- Database connection issues:
  - Verify `DATABASE_URL` format and credentials.
  - Remove unsupported URL query params if present.

## Security Notes

- Do not commit real secrets in `.env` files.
- Rotate credentials immediately if they were ever shared.
- Use a strong `SECRET_KEY` for JWT signing in non-local environments.
