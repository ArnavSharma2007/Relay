# RELAY — Enterprise Technical Support Video Platform

Production deployment: **Vercel** (frontend) + **Railway** (backend) + **Neon** (database).

See **[DEPLOY.md](./DEPLOY.md)** for the full hackathon deployment guide.
See **[HACKATHON.md](./HACKATHON.md)** for the 3-minute judge demo script.

## Quick Start (Local)

**Option A — Docker Postgres (fastest)**

```bash
cd relay
docker compose up -d
cp .env.example server/.env
# Edit server/.env: DATABASE_URL=postgresql://relay:relay@localhost:5432/relay

npm install
npm run db:push
npm run dev
```

**Option B — Neon (matches production)**

```bash
cd relay
cp .env.example server/.env
# Add your Neon DATABASE_URL to server/.env

npm install
npm run db:push
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Demo Credentials

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Agent | priya.sharma@relay.io | agent123  |
| Admin | admin@relay.io        | admin123  |

## What's Production-Ready

- PostgreSQL persistence (sessions, chat, timeline, recordings metadata)
- bcrypt password hashing
- Real recording capture via MediaRecorder + file upload
- S3/R2 cloud storage support for recordings
- Split deploy config for Vercel + Railway
- CORS configured for production domains

## Architecture

```
Vercel (React)  →  Railway (Express + Socket.IO + mediasoup)  →  Neon (Postgres)
                                              ↘  R2/S3 (recordings)
```
