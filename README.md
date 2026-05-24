# RTCD — Real-Time Collaborative Document Editor

Full-stack SaaS-style collaborative text editor with Google OAuth, document sharing via invitations, and real-time sync (Yjs + WebSockets).

## Project structure

```
RTCD/
  Backend/     FastAPI + PostgreSQL + WebSockets
  frontend/    React + Vite + Tailwind
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or remote)

## Quick start

### 1. Backend

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` (e.g. `postgresql+psycopg2://user:pass@localhost:5432/rtcd`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback`
- `JWT_SECRET_KEY`
- `FRONTEND_URL=http://localhost:3000`
- `CORS_ORIGINS=http://localhost:3000`
- `DEBUG=true`

Run migrations:

```powershell
alembic upgrade head
```

Start API:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```powershell
cd frontend
npm install
```

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Start UI:

```powershell
npm run dev
```

Open http://localhost:3000

### 3. Google OAuth console

Add authorized redirect URI:

`http://localhost:8000/auth/google/callback`

## Test the full flow

1. Login with Google → lands on **Documents**
2. **Create document** → open editor, type text (syncs via WebSocket)
3. Open second browser/incognito with another Google account
4. **Share** → invite by email → other user sees invite under **Invitations → Received** → **Accept** → opens same doc and sees live edits
5. **Profile** → update display name, logout

## API docs

With `DEBUG=true`: http://localhost:8000/docs

## Tech highlights (resume)

- Google OAuth 2.0 + JWT access/refresh tokens
- RBAC per document (OWNER / EDITOR / VIEWER)
- CRDT document state (Yjs) persisted with optimistic versioning
- WebSocket rooms for real-time collaboration
