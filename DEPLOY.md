# RELAY — Production Deployment Guide

Deploy RELAY as a real hackathon website in ~30 minutes.

## Architecture

| Service | Host | Purpose |
|---------|------|---------|
| Frontend | **Vercel** | React UI at `relay.vercel.app` |
| Backend | **Railway** | API + WebRTC + Socket.IO |
| Database | **Neon** | PostgreSQL (persistent data) |
| Storage | **Cloudflare R2** | Recording files (optional for demo) |

---

## Step 1: Database (Neon) — 5 min

1. Go to [neon.tech](https://neon.tech) → Create project → `relay`
2. Copy the connection string:
   ```
   postgresql://user:pass@ep-xxx.neon.tech/relay?sslmode=require
   ```

---

## Step 2: Backend (Railway) — 10 min

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set **Root Directory** to `relay/server` (or deploy whole monorepo with custom start)
4. Add environment variables:

```env
DATABASE_URL=postgresql://...   # from Neon
JWT_SECRET=<random-64-char-string>
CLIENT_URL=https://your-app.vercel.app
MEDIASOUP_ANNOUNCED_IP=<railway-public-domain>
STORAGE_DRIVER=local
NODE_ENV=production
```

5. Railway will run `npm run build` then `npm run start` (migrates DB automatically)
6. Copy your Railway URL: `https://relay-production.up.railway.app`
7. Test: `https://your-railway-url/api/health` → should return `{ status: "ok", db: "connected" }`

### Demo logins (seeded on first deploy)
- Agent: `priya.sharma@relay.io` / `agent123`
- Admin: `admin@relay.io` / `admin123`

---

## Step 3: Frontend (Vercel) — 5 min

1. Go to [vercel.com](https://vercel.com) → Import GitHub repo
2. Set **Root Directory** to `relay/client`
3. Add environment variables:

```env
VITE_API_URL=https://your-railway-url.up.railway.app/api
VITE_SOCKET_URL=https://your-railway-url.up.railway.app
```

4. Deploy → you get `https://relay-xxx.vercel.app`

---

## Step 4: Connect them — 2 min

1. Update Railway `CLIENT_URL` to your Vercel URL
2. Redeploy Railway (so CORS allows your frontend)

---

## Step 5: Cloudflare R2 (optional, for persistent recordings)

1. Create R2 bucket at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Create API token with R2 read/write
3. Add to Railway:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET=relay-recordings
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://pub-xxx.r2.dev
```

Without R2, recordings save to Railway disk (works for demo, may be lost on redeploy).

---

## Step 6: WebRTC for remote users (optional)

For judges joining from different networks:

1. Deploy coturn on a small VPS ($5/mo DigitalOcean)
2. Or use [Metered.ca](https://www.metered.ca/tools/openrelay/) free TURN
3. Add to Railway:

```env
TURN_URLS=turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443
TURN_USERNAME=openrelayproject
TURN_CREDENTIAL=openrelayproject
```

---

## Local development with production DB

```bash
# 1. Copy env
cp .env.example server/.env
# Edit DATABASE_URL to your Neon URL

# 2. Install & migrate
cd relay
npm install
cd server && npx prisma db push && npm run db:seed

# 3. Run
cd .. && npm run dev
```

---

## Hackathon demo script

1. **Login** as `priya.sharma@relay.io` → Dashboard shows live metrics from DB
2. **Create Session** → copy invite code
3. **Open incognito** → Customer tab → join with invite code
4. **Video call** works (camera/mic)
5. **Chat** messages persist in real time
6. **Record** → stop → appears in Recordings with real file
7. **Session History** → expandable rows with chat replay
8. **Admin** (login as `admin@relay.io`) → live ops dashboard

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Set `CLIENT_URL` on Railway to exact Vercel URL |
| DB connection failed | Check `DATABASE_URL` has `?sslmode=require` |
| Video not connecting | Set `MEDIASOUP_ANNOUNCED_IP` to Railway public IP |
| Socket disconnects | Ensure `VITE_SOCKET_URL` points to Railway, not Vercel |
| Health check 503 | Run `npx prisma db push` against your Neon DB |

---

## Custom domain

- Vercel: Add `relay.yourdomain.com` in project settings
- Railway: Add `api.yourdomain.com` in service settings
- Update `CLIENT_URL`, `VITE_API_URL`, `VITE_SOCKET_URL` accordingly
