# RTCD Frontend

React + Vite UI for the RTCD collaborative document editor.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

Set `VITE_API_BASE_URL` to your backend (default `http://localhost:8000`).

3. In **Backend** `.env`, ensure:

- `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback`
- `FRONTEND_URL=http://localhost:3000`
- `CORS_ORIGINS` includes `http://localhost:3000`

4. Run backend (PostgreSQL + migrations) on port 8000.

5. Run frontend:

```bash
npm run dev
```

Open http://localhost:3000

## Test flow

1. **Login** → Continue with Google → returns to `/auth/callback` with tokens → `/documents`
2. **Create document** → opens `/documents/{id}` editor with **real-time sync** (Yjs + WebSocket)
3. **Invitations** → another user invites you → **Received** tab → Accept → opens shared document
4. **Profile** → update name/avatar, logout

## Scripts

- `npm run dev` — dev server (port 3000)
- `npm run build` — production build
- `npm run lint` — TypeScript check
