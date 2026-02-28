# Deploy for Free: Render (Backend) + Vercel (Frontend)

This guide walks you through deploying the Smart Land Management app on the **free tiers** of Render and Vercel.

---

## Prerequisites

- **GitHub account** (to connect repos)
- **MongoDB Atlas** free cluster ([MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md))
- **Hugging Face token** (optional, for AI; [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

---

## Part 1: Backend on Render (Free Tier)

Render’s free tier gives **750 hours of compute per month** for web services (enough for a small Django API). Free services may spin down after inactivity; the first request after idle can take ~30–60 seconds (cold start).

### 1.1 Push your code to GitHub

If you haven’t already:

```bash
cd "d:\land managment beta"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 1.2 Create a Web Service on Render

1. Go to [render.com](https://render.com) and sign in (e.g. with GitHub).
2. Click **“New +”** → **“Web Service”**.
3. Connect your GitHub account if needed, then select the repository that contains this project.
4. Click **“Connect”**.

### 1.3 Configure the backend service

1. **Name:** Choose a name (e.g. `land-management-api`). This will be part of your URL: `https://YOUR-NAME.onrender.com`.
2. **Region:** Pick the one closest to your users.
3. **Branch:** `main` (or your default branch).
4. **Root Directory:** Set to `backend`. (This tells Render to build and run only the contents of the `backend` folder.)
5. **Runtime:** `Python 3`.
6. **Build Command:**  
   `pip install -r requirements.txt`  
   (No `build.sh`, `collectstatic`, or migrations — this app is API-only and uses MongoDB.)
7. **Start Command:**  
   `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`  
   (Render sets `PORT` automatically.)
8. **Instance Type:** Select **Free**.

### 1.4 Set environment variables (Render)

In the same screen (or later under **Environment** in the service dashboard), add these variables. Replace placeholders with your values.

| Variable | Value | Required |
|----------|--------|----------|
| `DJANGO_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` | Yes |
| `DEBUG` | `False` | Yes |
| `MONGO_URI` | Your MongoDB Atlas connection string (see [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)) | Yes |
| `MONGO_DB` | `land_management` | Yes |
| `ADMIN_EMAIL` | Your admin login email | Yes |
| `ADMIN_PASSWORD` | Strong password (change from default) | Yes |
| `ALLOWED_HOSTS` | Your Render hostname (optional on Render; see below) | Optional on Render |
| `CORS_ORIGINS` | Leave empty for now; add your Vercel URL after Part 2 | Yes (after Vercel) |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS_ORIGINS (add after Part 2) | Yes (after Vercel) |
| `HF_TOKEN` | Your Hugging Face token (optional, for AI) | No |

**ALLOWED_HOSTS:** On Render you can leave this unset: the backend automatically allows `RENDER_EXTERNAL_HOSTNAME`, which Render sets to your service hostname (e.g. `your-service-name.onrender.com`). If you use a custom domain, set `ALLOWED_HOSTS` to that hostname (and the Render hostname if you want both).

**Important:** Do not set `CORS_ORIGINS` or `CSRF_TRUSTED_ORIGINS` until you have your Vercel URL. Then set both to your Vercel app URL, e.g. `https://your-app.vercel.app` (no trailing slash).

### 1.5 Deploy and get backend URL

1. Click **“Create Web Service”**. Render will build and deploy.
2. When the deploy finishes, copy your **service URL** (e.g. `https://land-management-api.onrender.com`).  
   The API base is this URL; the frontend will call `https://YOUR-SERVICE.onrender.com/api`.

### 1.6 Check backend health

Open in a browser:

`https://YOUR_RENDER_SERVICE.onrender.com/api/health`

You should see a JSON response (e.g. `{"status":"ok"}` or similar). If the service was sleeping, the first load may take 30–60 seconds.

---

## Part 2: Frontend on Vercel (Free Tier)

Vercel’s free tier is enough for hobby Next.js apps.

### 2.1 Import project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **“Add New…” → “Project”**.
3. Import the **same GitHub repository** you used for Render.
4. Before deploying, set **Root Directory**: click **“Edit”** and set it to `land-management`. Confirm.

### 2.2 Environment variables (Vercel)

In the project settings (or during import), add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL **without** `/api`, e.g. `https://land-management-api.onrender.com` |

Optional:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for maps (optional) |

### 2.3 Deploy

1. Click **Deploy**. Vercel will build the Next.js app from `land-management`.
2. When finished, you’ll get a URL like `https://your-app.vercel.app`.

---

## Part 3: Point backend to frontend (CORS and CSRF)

1. Go back to **Render** → your backend service → **Environment**.
2. Add or update:
   - `CORS_ORIGINS` = `https://your-app.vercel.app` (your exact Vercel URL, no trailing slash)
   - `CSRF_TRUSTED_ORIGINS` = `https://your-app.vercel.app`
3. If you use a custom domain on Vercel later, add it as a second value, comma-separated, in both variables.
4. **Save Changes**. Render will redeploy the service so the new CORS/CSRF values are applied.

---

## Part 4: Verify

1. Open your Vercel URL: `https://your-app.vercel.app`.
2. Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` (the ones you set on Render).
3. Check that the dashboard loads, map works, and one AI action (e.g. “Get analysis” on Water or “Generate AI insights” on AI page) works.

---

## Quick reference

| Item | Where |
|------|--------|
| Backend API base | `https://YOUR_SERVICE.onrender.com` (frontend calls `/api` on this) |
| Frontend URL | `https://YOUR_VERCEL_APP.vercel.app` |
| Health check | `https://YOUR_SERVICE.onrender.com/api/health` |
| CORS / CSRF | Must match your Vercel (and custom domain if any) exactly |

---

## Troubleshooting

- **CORS errors in browser:** Ensure `CORS_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on Render exactly match your Vercel URL (protocol + host, no trailing slash). Save and let Render redeploy.
- **502 / 503 from backend:** Check Render logs (Logs tab). Ensure `MONGO_URI` is set and MongoDB Atlas allows connections (e.g. `0.0.0.0/0` in Network Access for development).
- **“Unauthorized” on login:** Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Render environment match what you’re typing. No extra spaces.
- **AI not working:** Add `HF_TOKEN` in Render (with Inference API access). If you don’t set it, the app falls back to built-in (non-AI) insights.
- **Slow first request:** On the free tier, Render spins down the service after inactivity. The first request after idle can take ~30–60 seconds; subsequent requests are fast until the next spin-down.

---

## Cost (free tier)

- **Render:** Free tier includes 750 hours of compute per month; a single small web service typically stays within this.
- **Vercel:** Hobby plan is free for personal projects.
- **MongoDB Atlas:** M0 cluster is free.
- **Hugging Face:** Free tier has limited inference credits.

You can run this stack at no cost for development and light production use.
