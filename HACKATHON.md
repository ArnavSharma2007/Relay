# RELAY — Hackathon Demo Script

Use this 3-minute flow when presenting to judges. It shows real persistence, live video, and production architecture.

## Before You Present

1. Deploy using [DEPLOY.md](./DEPLOY.md) (Vercel + Railway + Neon)
2. Confirm health check: `https://your-api.up.railway.app/api/health` → `{ status: "ok", db: "connected" }`
3. Open the live site in two browser windows (or laptop + phone)

---

## Demo Flow (3 min)

### 1. Agent login (30 sec)
- Open `https://your-app.vercel.app`
- Sign in: `priya.sharma@relay.io` / `agent123`
- Show **Dashboard** — live metrics from PostgreSQL, not hardcoded

### 2. Create a live session (30 sec)
- Go to **Live Sessions** → **New Session**
- Copy the invite link (`/login?code=RELAY-XXXX-XXXX`)
- Point out: invite code auto-fills when customer opens the link

### 3. Customer joins (45 sec)
- In second window, paste the invite link
- Customer lands on login → code pre-filled → **Join Session**
- Show **Call Room**: video tiles, signal quality, session timer
- Toggle chat, send a message — real-time via Socket.IO

### 4. File share + recording (45 sec)
- Drag a file into chat → uploads to storage, appears in **Files** tab
- Start recording → stop → go to **Recordings** → preview the capture
- Show timeline events updating in the side panel

### 5. Admin + analytics (30 sec)
- Log in as admin: `admin@relay.io` / `admin123`
- Open **Admin** — active sessions, agent roster, system events
- Open **Analytics** — success rate, top agents, volume charts from DB

---

## What Makes This Production-Grade

| Feature | Implementation |
|---------|----------------|
| Data persistence | PostgreSQL via Prisma |
| Auth | JWT + bcrypt password hashing |
| Real-time | Socket.IO (sessions, chat, typing) |
| Video | mediasoup SFU WebRTC |
| Recordings | MediaRecorder → multipart upload → disk/R2 |
| Deploy | Vercel (UI) + Railway (API/WebRTC) + Neon (DB) |

---

## Talking Points for Judges

- **"This isn't a mock UI"** — every session, message, and recording is stored in Postgres
- **"Split architecture"** — frontend on edge CDN, backend on Railway for WebSockets + UDP
- **"Enterprise UX"** — reconnect flow, issue escalation drawer, admin observability
- **"Scalable path"** — mediasoup worker pool, S3/R2 storage, optional TURN for NAT traversal

---

## Local Dev (No Cloud)

```bash
cd relay
docker compose up -d
cp .env.example server/.env
# Set DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
npm install && npm run db:push && npm run dev
```
