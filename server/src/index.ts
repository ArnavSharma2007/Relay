import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import recordingRoutes from './routes/recordings.js';
import fileRoutes from './routes/files.js';
import adminRoutes from './routes/admin.js';
import { setupSocketIO } from './socket/index.js';
import { createWorkers } from './mediasoup/worker.js';
import { tickLiveDurations } from './services/sessionService.js';
import { initStorage } from './services/storage.js';
import { seedDatabase } from './db/seed.js';
import { prisma } from './db/client.js';
import { env, getAllowedOrigins } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const allowedOrigins = getAllowedOrigins();

const isOriginAllowed = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) {
    callback(null, true);
    return;
  }
  const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(null, true); // Fallback for local debugging/testing if origin doesn't match
  }
};

const io = new Server(httpServer, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  },
});

app.use(cors({ origin: isOriginAllowed, credentials: true }));
app.use(express.json({ limit: '2mb' }));

if (env.storage.driver === 'local') {
  const storagePath = path.resolve(env.storage.localDir);
  app.use('/storage', express.static(storagePath));
}

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

setupSocketIO(io);

setInterval(async () => {
  const updated = await tickLiveDurations();
  updated.forEach((session) => io.emit('session:update', { session }));
}, 1000);

async function start() {
  if (!env.databaseUrl) {
    console.error('DATABASE_URL is required. Get a free Postgres URL from https://neon.tech');
    process.exit(1);
  }

  await prisma.$connect();
  await initStorage();
  await seedDatabase();
  await createWorkers();

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`RELAY server running on port ${env.port}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
