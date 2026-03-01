# Deploy Backend to Fly.io (Free Tier)

This guide walks you through moving the Django backend from Render to **Fly.io** free tier. The frontend stays on Vercel (e.g. mashorifarm.com).

---

## Prerequisites

- **Fly.io account** – [fly.io/apps](https://fly.io/apps) (sign up with GitHub or email)
- **Fly CLI** – [Install](https://fly.io/docs/hands-on/install-flyctl/)
  - Windows (PowerShell): `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`
  - Mac: `brew install flyctl`
- **MongoDB Atlas** – connection string in `.env` or Fly secrets
- **Git** – repo pushed to GitHub (optional; you can deploy from local)

---

## 1. Install Fly CLI and log in

```bash
# Install (see link above for your OS)
flyctl version

# Log in (opens browser)
fly auth login
```

---

## 2. Deploy from repo root (first time)

From the **project root** (where `fly.toml` is):

```bash
cd "d:\land managment beta"

# Create the app and deploy (use existing fly.toml; do not create a new one)
fly launch --no-deploy --copy-config --name smart-land-management-api
```

- `--no-deploy` – create the app but don’t deploy yet (so you can set secrets first).
- `--copy-config` – use the existing `fly.toml` (app name, build, vm, checks).
- If prompted “Create new app?”, choose **Yes** and pick your org (personal or team).

---

## 3. Set secrets (env vars)

Set these in Fly (replace with your real values):

```bash
fly secrets set DJANGO_SECRET_KEY="your-secret-key-here"
fly secrets set DEBUG="False"
fly secrets set MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/land_management?retryWrites=true&w=majority"
fly secrets set MONGO_DB="land_management"
fly secrets set ADMIN_EMAIL="your-admin@example.com"
fly secrets set ADMIN_PASSWORD="your-secure-password"
fly secrets set CORS_ORIGINS="https://www.mashorifarm.com,https://mashorifarm.com"
fly secrets set CSRF_TRUSTED_ORIGINS="https://www.mashorifarm.com,https://mashorifarm.com"
```

Optional (AI):

```bash
fly secrets set HF_TOKEN="your-huggingface-token"
```

**Note:** For `MONGO_URI` with special characters, use quotes. On Windows PowerShell you may need to escape or use single quotes.

---

## 4. Deploy

```bash
fly deploy
```

Build runs from `backend/Dockerfile`; the app listens on port **8080** and Fly’s health check hits `/api/health`.

---

## 5. Get your backend URL

After a successful deploy:

```bash
fly status
fly open
```

Your API base URL will be:

**`https://smart-land-management-api.fly.dev`**

- Health: `https://smart-land-management-api.fly.dev/api/health`
- Login: `POST https://smart-land-management-api.fly.dev/api/auth/login/`

---

## 6. Point frontend (Vercel) to Fly.io

In **Vercel** → your project → **Settings** → **Environment Variables**:

| Name                   | Value                                              |
|------------------------|----------------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | `https://smart-land-management-api.fly.dev`        |

Redeploy the frontend so it uses the new API URL.

---

## 7. Fly.io free tier notes

- **Auto stop/start** – In `fly.toml`, `min_machines_running = 0` and `auto_stop_machines` / `auto_start_machines` mean the app can sleep when idle (free tier).
- **Cold starts** – First request after sleep may take a few seconds.
- **VM** – 256MB RAM, shared CPU; the Dockerfile uses 2 gunicorn workers to fit.
- **Region** – Default region is chosen at launch; you can change with `fly regions set <region>`.

---

## Useful commands

| Command              | Description                    |
|----------------------|--------------------------------|
| `fly status`         | App and machine status         |
| `fly open`           | Open app URL in browser       |
| `fly logs`           | Stream logs                   |
| `fly ssh console`     | SSH into the machine         |
| `fly secrets list`   | List secrets (values hidden)  |
| `fly deploy`         | Build and deploy              |
| `fly apps destroy <app>` | Delete app (careful!)     |

---

## Troubleshooting

- **“App not listening on expected address”** – App must listen on `0.0.0.0:8080`. The Dockerfile already uses `--bind 0.0.0.0:${PORT}` and `fly.toml` sets `PORT=8080`.
- **502 Bad Gateway** – Check `fly logs`; often startup or env (e.g. `MONGO_URI`) issue.
- **CORS errors** – Ensure `CORS_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in Fly secrets match your frontend URL(s) exactly (e.g. `https://www.mashorifarm.com`).
- **ALLOWED_HOSTS** – Django allows `*.fly.dev` via `FLY_APP_NAME`; no extra config needed if you use the default app name.

---

## Summary

| Item        | Value                                                |
|------------|------------------------------------------------------|
| App name   | `smart-land-management-api`                          |
| API base   | `https://smart-land-management-api.fly.dev`         |
| Health     | `https://smart-land-management-api.fly.dev/api/health` |
| Build      | `backend/Dockerfile` (from repo root)               |
| Port       | 8080                                                 |

After switching, you can remove or stop the backend service on Render.
