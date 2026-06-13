import { Router } from 'express';
import {
  getSessions,
  getSessionById,
  getSessionByInviteCode,
  createSession,
  updateSessionStatus,
  getChat,
  getTimeline,
  getFiles,
  getParticipants,
  getDashboardMetrics,
  getAnalytics,
  getActivities,
} from '../services/sessionService.js';
import { getAgents } from '../services/userService.js';
import { getRecordingBySessionId } from '../services/recordingService.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

router.use(authMiddleware);

router.get('/agents/list', async (_req, res) => {
  res.json(await getAgents());
});

router.get('/dashboard', async (_req, res) => {
  res.json({
    metrics: await getDashboardMetrics(),
    activities: await getActivities(),
    liveSessions: await getSessions({ status: ['live', 'waiting', 'connecting', 'reconnecting'] }).then((s) => s.slice(0, 5)),
  });
});

router.get('/analytics', async (_req, res) => {
  res.json(await getAnalytics());
});

router.get('/', async (req: AuthRequest, res) => {
  const { status, agentId, search, dateFrom, dateTo } = req.query;
  const statusFilter = status ? (Array.isArray(status) ? status : [status]).map(String) : undefined;
  res.json(
    await getSessions({
      status: statusFilter,
      agentId: agentId as string | undefined,
      search: search as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
    })
  );
});

router.post('/', async (req: AuthRequest, res) => {
  const { customerName, customerEmail, agentId, priority, notes } = req.body;
  if (!customerName || !customerEmail) {
    res.status(400).json({ error: 'Customer name and email required' });
    return;
  }

  const session = await createSession({
    customerName,
    customerEmail,
    agentId: agentId || req.user?.id || null,
    priority: priority || 'normal',
    notes,
    baseUrl: env.clientUrls[0],
  });

  res.status(201).json(session);
});

router.get('/:id', async (req, res) => {
  const session = await getSessionById(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const [chat, timeline, files, participants, recording] = await Promise.all([
    getChat(session.id),
    getTimeline(session.id),
    getFiles(session.id),
    getParticipants(session.id),
    getRecordingBySessionId(session.id),
  ]);

  res.json({ session, chat, timeline, files, participants, recording });
});

router.patch('/:id/status', async (req, res) => {
  const session = await updateSessionStatus(req.params.id, req.body.status);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('session:update', { session });
  }

  res.json(session);
});

router.get('/:id/chat', async (req, res) => {
  res.json(await getChat(req.params.id));
});

export default router;
