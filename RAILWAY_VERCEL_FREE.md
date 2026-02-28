# Deploy for Free: Railway (Backend) + Vercel (Frontend)

This guide walks you through deploying the Smart Land Management app on the **free tiers** of Railway and Vercel.

---

## Prerequisites

- **GitHub account** (to connect repos)
- **MongoDB Atlas** free cluster ([MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md))
- **Hugging Face token** (optional, for AI; [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens))

---

## Part 1: Backend on Railway (Free Tier)

Railway gives **$5 free credit per month** on the free tier (enough for a small Django app).

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

### 1.2 Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. Click **“New Project”**.
3. Choose **“Deploy from GitHub repo”** and select your repository.
4. When asked which repo to deploy, select the same repo. We’ll set the **root directory** in the next step.

### 1.3 Configure the backend service

1. After the service is created, open it and go to **Settings**.
2. Under **Source**, set **Root Directory** to: `backend`
3. Under **Build**:
   - **Builder**: Nixpacks (default) or Dockerfile (backend has a Dockerfile).
   - If using Nixpacks, Railway will detect Python and use the `Procfile` in `backend`.
4. Under **Deploy**, Railway will use the `web` process from the Procfile (gunicorn).
5. Under **Networking**, click **“Generate Domain”** to get a URL like `your-app.up.railway.app`.

### 1.4 Set environment variables (Railway)

In your service, go to **Variables** and add (replace placeholders):

| Variable | Value | Required |
|----------|--------|----------|
| `DJANGO_SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` | Yes |
| `DEBUG` | `False` | Yes |
| `MONGO_URI` | Your MongoDB Atlas connection string (see MONGODB_ATLAS_SETUP.md) | Yes |
| `MONGO_DB` | `land_management` | Yes |
| `ADMIN_EMAIL` | Your admin login email | Yes |
| `ADMIN_PASSWORD` | Strong password (change from default) | Yes |
| `ALLOWED_HOSTS` | Your Railway host, e.g. `your-app.up.railway.app` | Yes |
| `CORS_ORIGINS` | Leave empty for now; add your Vercel URL after Part 2 | Yes (after Vercel) |
| `CSRF_TRUSTED_ORIGINS` | Same as CORS_ORIGINS (add after Part 2) | Yes (after Vercel) |
| `HF_TOKEN` | Your Hugging Face token (optional, for AI) | No |

**Important:** Do not set `CORS_ORIGINS` or `CSRF_TRUSTED_ORIGINS` until you have your Vercel URL. Then set both to your Vercel app URL, e.g. `https://your-app.vercel.app` (no trailing slash).

### 1.5 Deploy and get backend URL

1. Save variables and let Railway redeploy (or trigger **Redeploy**).
2. Copy your **public URL** (e.g. `https://your-app.up.railway.app`).  
   The API base is this URL; the frontend will call `https://your-app.up.railway.app/api`.

### 1.6 Check backend health

Open in a browser:

`https://YOUR_RAILWAY_DOMAIN/api/health`

You should see a JSON response (e.g. `{"status":"ok"}` or similar).

---

## Part 2: Frontend on Vercel (Free Tier)

Vercel’s free tier is enough for hobby Next.js apps.

### 2.1 Import project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **“Add New…” → “Project”**.
3. Import the **same GitHub repository** you used for Railway.
4. Before deploying, set **Root Directory**: click **“Edit”** and set it to `land-management`. Confirm.

### 2.2 Environment variables (Vercel)

In the project settings (or during import), add:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL **without** `/api`, e.g. `https://your-app.up.railway.app` |

Optional:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox token for maps (optional) |

### 2.3 Deploy

1. Click **Deploy**. Vercel will build the Next.js app from `land-management`.
2. When finished, you’ll get a URL like `https://your-app.vercel.app`.

### 2.4 Point backend to frontend (CORS)

1. Go back to **Railway** → your backend service → **Variables**.
2. Set:
   - `CORS_ORIGINS` = `https://your-app.vercel.app` (your exact Vercel URL, no trailing slash)
   - `CSRF_TRUSTED_ORIGINS` = `https://your-app.vercel.app`
3. If you use a custom domain on Vercel later, add it as a second value, comma-separated, in both variables.
4. Redeploy the Railway service so the new CORS/CSRF values are applied.

---

## Part 3: Verify

1. Open your Vercel URL: `https://your-app.vercel.app`.
2. Log in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` (the ones you set on Railway).
3. Check that the dashboard loads, map works, and one AI action (e.g. “Get analysis” on Water or “Generate AI insights” on AI page) works.

---

## Quick reference

| Item | Where |
|------|--------|
| Backend API base | `https://YOUR_RAILWAY_DOMAIN` (frontend calls `/api` on this) |
| Frontend URL | `https://YOUR_VERCEL_APP.vercel.app` |
| Health check | `https://YOUR_RAILWAY_DOMAIN/api/health` |
| CORS / CSRF | Must match your Vercel (and custom domain if any) exactly |

---

## Troubleshooting

- **CORS errors in browser:** Ensure `CORS_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on Railway exactly match your Vercel URL (protocol + host, no trailing slash). Then redeploy Railway.
- **502 / 503 from backend:** Check Railway logs (Deployments → View Logs). Ensure `MONGO_URI` is set and Atlas allows connections from anywhere (`0.0.0.0/0`) or from Railway’s IPs.
- **“Unauthorized” on login:** Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` in Railway variables match what you’re typing. No extra spaces.
- **AI not working:** Add `HF_TOKEN` in Railway (with Inference API access). If you don’t set it, the app falls back to built-in (non-AI) insights.

---

## Cost (free tier)

- **Railway:** $5 free credit/month; a small Django app usually stays within this.
- **Vercel:** Hobby plan is free for personal projects.
- **MongoDB Atlas:** M0 cluster is free.
- **Hugging Face:** Free tier has limited inference credits.

You can run this stack at no cost for development and light production use.
