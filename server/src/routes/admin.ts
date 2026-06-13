import { Router } from 'express';
import { prisma } from '../db/client.js';
import { getAgents } from '../services/userService.js';
import { getSessions } from '../services/sessionService.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import type { AdminMetrics, AdminEvent } from '../../../shared/types.js';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/metrics', async (_req, res) => {
  const activeSessions = (await getSessions({ status: ['live', 'connecting', 'reconnecting'] })).length;
  const agents = await getAgents();
  const events = await prisma.adminEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  const failedSessions = await getSessions({ status: ['failed', 'reconnecting'] });

  const metrics: AdminMetrics = {
    activeSessions,
    cpu: Math.round((15 + Math.random() * 30) * 10) / 10,
    memory: Math.round((45 + Math.random() * 20) * 10) / 10,
    networkIn: Math.round((15 + Math.random() * 40) * 10) / 10,
    networkOut: Math.round((12 + Math.random() * 35) * 10) / 10,
    errorRate: Math.round((0.1 + Math.random() * 2) * 100) / 100,
    activeSessionsTrend: 0,
    cpuTrend: 0,
    memoryTrend: 0,
    networkTrend: 0,
    errorRateTrend: 0,
  };

  const history = Array.from({ length: 60 }, (_, i) => ({
    time: new Date(Date.now() - (59 - i) * 60000).toISOString(),
    sessions: Math.max(0, activeSessions + Math.floor(Math.random() * 3) - 1),
    networkIn: 10 + Math.random() * 40,
    networkOut: 8 + Math.random() * 35,
  }));

  res.json({
    metrics,
    history,
    agents,
    events: events.map((e) => ({
      id: e.id,
      timestamp: e.createdAt.toISOString(),
      severity: e.severity as AdminEvent['severity'],
      message: e.message,
      source: e.source,
    })),
    failedSessions: failedSessions.slice(0, 5).map((s) => ({
      sessionCode: s.sessionCode,
      customerName: s.customerName,
    })),
  });
});

export default router;
