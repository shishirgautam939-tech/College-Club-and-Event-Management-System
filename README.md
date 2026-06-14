# College Club and Event Management System

Full-stack app for managing college clubs, events, QR attendance, and digital certificates.

**GitHub:** [shishirgautam939-tech/College-Club-and-Event-Management-System](https://github.com/shishirgautam939-tech/College-Club-and-Event-Management-System)

## Deploy publicly (shareable link)

The repo includes a **Render Blueprint** — one click deploys both the website and API.

### Step 1 — Deploy on Render

1. Open **[Deploy Blueprint on Render](https://dashboard.render.com/blueprint/new?repo=https://github.com/shishirgautam939-tech/College-Club-and-Event-Management-System)**
2. Sign in with GitHub (if needed)
3. Click **Apply** — Render creates the database, API, and frontend
4. Wait ~10–15 minutes for the first build

### Step 2 — Share your link

| What | URL |
|------|-----|
| **Public website** | https://ccems-web.onrender.com |
| API | https://ccems-api.onrender.com/api/ |

### Admin login

- **Email:** `admin@gmail.com`
- **Password:** `admin123`

> Change the admin password in Render → ccems-api → Environment after going live.

## Local development

See [DEPLOY.md](./DEPLOY.md) and the project README inside  
`Events-and-Clubs-Management-main/Events-and-Clubs-Management-main/`.

## Project layout

```
Events-and-Clubs-Management-main/Events-and-Clubs-Management-main/
├── backend/     Django REST API
├── client/      React frontend
└── render.yaml  (nested — root render.yaml is used for deploy)
```
