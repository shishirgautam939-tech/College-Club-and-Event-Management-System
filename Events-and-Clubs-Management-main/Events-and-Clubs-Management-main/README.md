# Events and Clubs Management

College event and club management system with React frontend and Django REST API backend.

Live demo: [events-and-clubs-management.vercel.app](https://events-and-clubs-management.vercel.app)

## Features

- Club and user management with role-based access (Student, Faculty, Admin)
- Event proposal, review, approval, and registration
- **QR-based attendance verification** — organizers display a QR code; students scan to check in
- **Digital certificate generation** — PDF certificates issued automatically when an event is completed
- Attendance tracking (manual + QR)
- Warm, simple UI redesign ("Campus Connect")

## Project structure

```
backend/     Django REST API
client/      React + Vite frontend
```

## Setup

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # configure DB if using PostgreSQL
python manage.py migrate
python manage.py runserver
```

For local development without PostgreSQL:

```bash
DATABASE_URL=sqlite:///./db.sqlite3 python manage.py migrate
```

### Frontend

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL=http://127.0.0.1:8000/api/
npm run dev
```

## QR attendance flow

1. Faculty/admin opens **Attendance → QR check-in** for an approved event
2. Click **Start QR check-in** — a QR code is displayed at the venue
3. Registered students open **Scan QR** in the app and scan the code
4. Attendance is recorded instantly (must be registered first)

## Certificate flow

1. Mark attendance (manual or QR)
2. Click **Complete event & issue certificates**
3. Present attendees can download PDF certificates from **My Events** or **Certificates**

## New API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/events/{id}/attendance/qr/` | Manage event QR check-in |
| POST | `/api/attendance/verify-qr/` | Student verifies attendance via QR |
| GET | `/api/my/certificates/` | List student's certificates |
| GET | `/api/events/{id}/certificate/download/` | Download own certificate for event |
| POST | `/api/events/{id}/certificates/` | Generate certificates for present attendees |
