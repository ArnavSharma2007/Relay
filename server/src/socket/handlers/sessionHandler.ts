import { Server, Socket } from 'socket.io';
import {
  getSessionById,
  updateSessionStatus,
  addParticipant,
  addTimelineEvent,
  setSessionRecording,
} from '../../services/sessionService.js';
import { createRecording, getRecordingBySessionId, updateRecording } from '../../services/recordingService.js';
import { verifyToken } from '../../middleware/auth.js';
import { getAgents } from '../../services/userService.js';
import { prisma } from '../../db/client.js';
import type { User } from '../../../../shared/types.js';

interface SocketData {
  user: Omit<User, 'password'>;
  sessionId?: string;
}

export function registerSessionHandlers(io: Server, socket: Socket) {
  const data = socket.data as SocketData;

  socket.on('session:join', async (payload: { sessionId: string }) => {
    const { sessionId } = payload;
    const session = await getSessionById(sessionId);

    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    data.sessionId = sessionId;
    socket.join(sessionId);

    await addParticipant({
      sessionId,
      userId: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      joinedAt: new Date().toISOString(),
      quality: 'hd',
    });

    if (session.status === 'waiting') {
      const updated = await updateSessionStatus(sessionId, 'connecting');
      if (updated) io.emit('session:update', { session: updated });
    }

    setTimeout(async () => {
      const current = await getSessionById(sessionId);
      if (current && (current.status === 'connecting' || current.status === 'waiting')) {
        const updated = await updateSessionStatus(sessionId, 'live');
        if (updated) {
          io.emit('session:update', { session: updated });
          const event = await addTimelineEvent(sessionId, {
            type: 'join',
            description: `${data.user.role === 'customer' ? 'Customer' : 'Agent'} joined`,
            actor: data.user.name,
            actorId: data.user.id,
          });
          io.to(sessionId).emit('timeline:event', { event });
        }
      }
    }, 1500);

    socket.to(sessionId).emit('session:participant', {
      action: 'join',
      user: { id: data.user.id, name: data.user.name, role: data.user.role },
    });

    socket.emit('reconnect:ack', { sessionId });
  });

  socket.on('session:leave', async (payload: { sessionId: string }) => {
    const { sessionId } = payload;
    socket.leave(sessionId);

    const event = await addTimelineEvent(sessionId, {
      type: 'leave',
      description: `${data.user.name} left`,
      actor: data.user.name,
      actorId: data.user.id,
    });
    io.to(sessionId).emit('timeline:event', { event });

    socket.to(sessionId).emit('session:participant', {
      action: 'leave',
      user: { id: data.user.id, name: data.user.name, role: data.user.role },
    });

    if (data.user.role === 'agent' || data.user.role === 'admin') {
      const updated = await updateSessionStatus(sessionId, 'ended');
      if (updated) io.emit('session:update', { session: updated });
    }
  });

  socket.on('recording:start', async (payload: { sessionId: string }) => {
    const { sessionId } = payload;
    const session = await setSessionRecording(sessionId, true);
    if (session) {
      const recording = await createRecording(session);
      io.to(sessionId).emit('recording:status', {
        sessionId,
        status: 'recording',
        recordingId: recording.id,
      });
      const event = await addTimelineEvent(sessionId, {
        type: 'recording_start',
        description: 'Recording started',
        actor: data.user.name,
        actorId: data.user.id,
      });
      io.to(sessionId).emit('timeline:event', { event });
      io.emit('session:update', { session });
    }
  });

  socket.on('recording:stop', async (payload: { sessionId: string }) => {
    const { sessionId } = payload;
    const session = await setSessionRecording(sessionId, false);
    if (session) {
      const recording = await getRecordingBySessionId(sessionId);
      if (recording) {
        await updateRecording(recording.id, { status: 'processing' });
      }
      io.to(sessionId).emit('recording:status', {
        sessionId,
        status: 'stopped',
        recordingId: recording?.id,
      });
      const event = await addTimelineEvent(sessionId, {
        type: 'recording_stop',
        description: 'Recording stopped',
        actor: data.user.name,
        actorId: data.user.id,
      });
      io.to(sessionId).emit('timeline:event', { event });
      io.emit('session:update', { session });
    }
  });
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token as string;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    next(new Error('Invalid token'));
    return;
  }

  (socket.data as SocketData).user = user;
  next();
}

export async function emitAdminMetrics(io: Server) {
  const activeSessions = await prisma.session.count({
    where: { status: { in: ['live', 'connecting', 'reconnecting'] } },
  });
  const agents = await getAgents();
  const events = await prisma.adminEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

  io.to('admin-room').emit('admin:metrics', {
    activeSessions,
    cpu: Math.round((15 + Math.random() * 30) * 10) / 10,
    memory: Math.round((45 + Math.random() * 20) * 10) / 10,
    networkIn: Math.round((15 + Math.random() * 40) * 10) / 10,
    networkOut: Math.round((12 + Math.random() * 35) * 10) / 10,
    errorRate: Math.round((0.1 + Math.random() * 2) * 100) / 100,
  });
  io.to('admin-room').emit('admin:agents', agents);
  io.to('admin-room').emit('admin:events', events.map((e) => ({
    id: e.id,
    timestamp: e.createdAt.toISOString(),
    severity: e.severity,
    message: e.message,
    source: e.source,
  })));
}
