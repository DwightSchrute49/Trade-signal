# Deployment Guide — Railway (Backend) + Vercel (Frontend)

## Backend (Railway)

1. **Create a new project** on [Railway](https://railway.app) and connect your repo.

2. **Set Root Directory** to `backend` (in Project Settings).

3. **Environment Variables** (Railway → Variables):
   - `DATABASE_URL` — Your Neon Postgres connection string (from Neon dashboard)

4. **Deploy** — Railway will detect Python and use the Procfile to run:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. **Get your backend URL** — e.g. `https://your-app.up.railway.app`

---

## Frontend (Vercel)

1. **Import your repo** on [Vercel](https://vercel.com).

2. **Set Root Directory** to `frontend` (in Project Settings).

3. **Environment Variables** (Vercel → Project Settings → Environment Variables):
   - `VITE_API_URL` = `https://your-railway-backend.up.railway.app`  
     (use your actual Railway URL, **no trailing slash**)

4. **Deploy** — Vercel will build and deploy the React app.

---

## Checklist

- [ ] Backend: `DATABASE_URL` set on Railway
- [ ] Frontend: `VITE_API_URL` set on Vercel (points to Railway URL)
- [ ] CORS: Backend allows `*` origins (already configured)
- [ ] After deploy: Test login, signup, and API calls from the live frontend
