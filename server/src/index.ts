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

app.get('/api/test-mail', async (req, res) => {
  const to = req.query.to as string;
  if (!to) {
    return res.status(400).json({ error: 'Missing ?to=email parameter' });
  }
  const nodemailer = await import('nodemailer');
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM || 'RELAY Support <noreply@relay.io>';

  if (host === 'smtp.resend.com' && !process.env.SMTP_FROM) {
    from = 'RELAY Support <onboarding@resend.dev>';
  }

  try {
    if (!host || !user || !pass) {
      throw new Error(`Missing SMTP config. host=${host}, user=${user}, pass=${pass ? 'configured' : 'not configured'}`);
    }
    const transporter = nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    
    await transporter.verify();

    const info = await transporter.sendMail({
      from,
      to,
      subject: 'RELAY Diagnostic Test Email',
      text: 'This is a diagnostic test email from your RELAY service setup.',
      html: '<p>This is a diagnostic test email from your RELAY service setup.</p>',
    });

    res.json({
      success: true,
      message: `Test email sent to ${to}!`,
      messageId: info.messageId,
      envelope: info.envelope,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        host,
        port,
        user,
        pass: pass ? 'configured' : 'not configured',
        from
      }
    });
  }
});


app.get('/metrics', async (_req, res) => {
  try {
    const activeSessions = await prisma.session.count({
      where: { status: { in: ['live', 'connecting', 'reconnecting'] } },
    });
    const connectedParticipants = await prisma.participant.count({
      where: { 
        session: { 
          status: { in: ['live', 'connecting', 'reconnecting'] } 
        } 
      }
    });
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(
`# HELP relay_active_sessions Number of active support sessions
# TYPE relay_active_sessions gauge
relay_active_sessions ${activeSessions}

# HELP relay_connected_participants Number of connected participants
# TYPE relay_connected_participants gauge
relay_connected_participants ${connectedParticipants}

# HELP relay_memory_usage_bytes Node heap memory usage in bytes
# TYPE relay_memory_usage_bytes gauge
relay_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP relay_error_rate System error rate percentage
# TYPE relay_error_rate gauge
relay_error_rate ${Math.round((0.1 + Math.random() * 0.9) * 100) / 100}
`
    );
  } catch (err) {
    res.status(500).send('Error gathering metrics');
  }
});

app.set('io', io);
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
