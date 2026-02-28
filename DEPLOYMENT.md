# Deploying Land Management Beta

This app has two parts: **Next.js frontend** and **Django (Python) backend** with **MongoDB**. Below are recommended ways to deploy.

---

## 1. Prerequisites

- **MongoDB Atlas**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier) for deployment.  
  **→ Step-by-step setup: see [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md).**  
  Summary: create a cluster → Database Access (user + password) → Network Access (allow `0.0.0.0/0`) → get connection string → set `MONGO_URI` and `MONGO_DB=land_management` in your backend env.

- **Git**: Push your code to GitHub (or GitLab) so hosting platforms can deploy from the repo.

---

## 2. Option A: Vercel (frontend) + Railway (backend)

Good balance of free tiers and simplicity.

### Step 1: Deploy backend on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select your repo.
3. Set **Root Directory** to `backend` (so Railway runs Django from the `backend` folder).
4. Add **MongoDB** in Railway (New → Database → MongoDB) or use your Atlas URI.
5. In your backend service → **Variables**, add:

   | Variable          | Value |
   |-------------------|--------|
   | `DJANGO_SECRET_KEY` | Long random string (e.g. from [djecrety.ir](https://djecrety.ir/)) |
   | `DEBUG`           | `False` |
   | `MONGO_URI`       | Your Atlas URI (or Railway MongoDB URL) |
   | `MONGO_DB`        | `land_management` |
   | `ALLOWED_HOSTS`   | `*.railway.app` (or your backend domain) |
   | `CORS_ORIGINS`    | `https://YOUR-FRONTEND.vercel.app` (add after deploying frontend) |

6. **Settings** → **Deploy**:
   - **Build Command**: `pip install -r requirements.txt` (create `backend/requirements.txt` if missing: `pip freeze > requirements.txt` from inside `backend`).
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` (install gunicorn: add `gunicorn` to requirements.txt).
7. Deploy. Copy the public URL (e.g. `https://your-backend.railway.app`). Your API will be at `https://your-backend.railway.app/api/`.

### Step 2: Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import your repo.
3. Set **Root Directory** to `land-management`.
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app/api` (no trailing slash).
5. Deploy. Copy the frontend URL (e.g. `https://land-management-xxx.vercel.app`).

### Step 3: Allow frontend in backend CORS

- In Railway → backend service → **Variables** → set  
  `CORS_ORIGINS` = `https://land-management-xxx.vercel.app` (your exact Vercel URL).  
- Redeploy the backend if needed.

---

## 3. Option B: Render (backend + frontend)

You can host both on [render.com](https://render.com).

### Backend (Web Service)

1. **New** → **Web Service** → connect repo.
2. **Root Directory**: `backend`.
3. **Environment**: Python 3.
4. **Build**: `pip install -r requirements.txt` (and install `gunicorn` in requirements).
5. **Start**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
6. Add env vars: `DJANGO_SECRET_KEY`, `DEBUG=False`, `MONGO_URI`, `MONGO_DB`, `ALLOWED_HOSTS`, `CORS_ORIGINS` (your Render frontend URL).

### Frontend (Static Site or Web Service)

- **New** → **Static Site** (or Web Service for full Next.js):
  - Root: `land-management`
  - Build: `npm run build`
  - Publish: `out` if you export static, or use **Web Service** with `npm run start` and Node.
- Set `NEXT_PUBLIC_API_URL` to your Render backend URL + `/api`.

---

## 4. Option C: VPS (DigitalOcean, Linode, etc.) with Docker

For full control, run backend and frontend on a single server.

### Backend with Docker

A `Dockerfile` in `backend/` can look like:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

- Build and run the image; set env vars (`MONGO_URI`, `DJANGO_SECRET_KEY`, `CORS_ORIGINS`, etc.) when running the container.
- Use **nginx** (or Caddy) as reverse proxy and optionally serve the Next.js build (e.g. `next export` and serve static, or run `next start` behind nginx).

---

## 5. Environment variables summary

### Backend (Django)

| Variable            | Required | Description |
|--------------------|----------|-------------|
| `DJANGO_SECRET_KEY`| Yes      | Secret key (long random string). |
| `DEBUG`            | Yes      | `False` in production. |
| `MONGO_URI`        | Yes      | MongoDB connection string (Atlas or hosted). |
| `MONGO_DB`         | No       | Database name (default: `land_management`). |
| `ALLOWED_HOSTS`    | Prod     | Comma-separated hostnames, e.g. `api.railway.app`. |
| `CORS_ORIGINS`     | Prod     | Comma-separated frontend URLs, e.g. `https://yourapp.vercel.app`. |
| `GEMINI_API_KEY`   | No       | For AI features (optional). |

### Frontend (Next.js)

| Variable                | Required | Description |
|-------------------------|----------|-------------|
| `NEXT_PUBLIC_API_URL`   | Yes      | Backend API base, e.g. `https://your-backend.railway.app/api`. |

---

## 6. Backend requirements and run command

- Ensure `backend/requirements.txt` exists and includes at least:
  - `Django`, `djangorestframework`, `django-cors-headers`, `pymongo`, `python-dotenv`, `gunicorn`
- Production run:
  - `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
  - Platforms (Railway, Render) set `PORT`; use it in the bind address.

---

## 7. Quick checklist

- [ ] MongoDB Atlas cluster created and connection string copied.
- [ ] Backend env: `DJANGO_SECRET_KEY`, `DEBUG=False`, `MONGO_URI`, `MONGO_DB`, `ALLOWED_HOSTS`, `CORS_ORIGINS`.
- [ ] Frontend env: `NEXT_PUBLIC_API_URL` = backend URL + `/api`.
- [ ] Backend starts with `gunicorn` and listens on `$PORT`.
- [ ] After first deploy, set `CORS_ORIGINS` to your real frontend URL and redeploy backend if needed.

Once these are in place, your Land Management site should be live end-to-end.
