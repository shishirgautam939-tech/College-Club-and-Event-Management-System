# Public deployment

This project deploys from GitHub using **Render** (free tier).

## One-time setup (5 minutes)

1. Open [Render Blueprint deploy](https://dashboard.render.com/blueprint/new)
2. Connect GitHub and select repo: `shishirgautam939-tech/College-Club-and-Event-Management-System`
3. Render reads `render.yaml` at the repo root and creates:
   - **ccems-api** — Django backend + PostgreSQL
   - **ccems-web** — React frontend (public website)
4. Click **Apply** and wait ~10–15 minutes for the first build

## Public URLs

After deploy succeeds:

| Service | URL |
|---------|-----|
| **Website (share this link)** | https://ccems-web.onrender.com |
| API | https://ccems-api.onrender.com/api/ |

## Admin login (production)

| Email | Password |
|-------|----------|
| admin@gmail.com | admin123 |

Change the admin password in Render → **ccems-api** → Environment after first login.

## Notes

- Free tier services sleep after ~15 min idle; first visit may take 30–60 seconds to wake up.
- Auto-deploy: every push to `main` redeploys both services.
- To use a custom domain, add it in Render dashboard for **ccems-web**.

## Alternative: Vercel frontend

If you prefer Vercel for the frontend:

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `Events-and-Clubs-Management-main/Events-and-Clubs-Management-main/client`
3. Add environment variable: `VITE_API_URL=https://ccems-api.onrender.com/api/`
4. Deploy
