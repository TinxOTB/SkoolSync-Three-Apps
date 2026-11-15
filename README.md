# SkoolSync — three-app starter pack

This development starter contains:
- `backend/` — FastAPI API and SQLite development database
- `skoolsync-admin/` — Expo app for school administrators
- `skoolsync-teacher/` — Expo app for teachers
- `skoolsync-family/` — Expo app for parents/learners
- `shared/SkoolSyncApp.tsx` — shared starter interface

## Requirements
Install Node.js LTS, Python 3.11+, and Visual Studio Code. Install Expo Go on an Android phone for local testing.

## 1. Start the backend (Windows PowerShell)
Open a VS Code terminal:
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open http://127.0.0.1:8000/docs to inspect the API.

## 2. Start each mobile app
Open a separate VS Code terminal for each app:
```powershell
cd skoolsync-admin
npm install
npx expo start
```
Repeat with `skoolsync-teacher` and `skoolsync-family`.

For a physical phone, edit each app's `src/config.ts` and replace `192.168.1.10` with your PC's local IPv4 address. Your phone and PC must be on the same Wi-Fi network. For Android emulator, use `10.0.2.2`.

## Important limitations
This is an MVP development scaffold, not a production-ready school information system. Before real school use, add and test role-specific screens, parent-to-learner linking, results, fees, timetables, audit logs, backups, HTTPS hosting, stronger authentication/rate limiting, privacy controls, and automated tests. Do not store real children's data in this starter until those safeguards have been reviewed.
