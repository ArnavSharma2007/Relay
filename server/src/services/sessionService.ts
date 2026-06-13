import { prisma } from '../db/client.js';
import type {
  Session,
  ChatMessage,
  TimelineEvent,
  SessionFile,
  Participant,
  ActivityEvent,
  DashboardMetrics,
  AnalyticsData,
} from '../../../shared/types.js';

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RLY-${part()}-${part()}`;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `RELAY-${part()}-${part()}`;
}

function mapSession(row: {
  id: string;
  sessionCode: string;
  inviteCode: string;
  inviteLink: string;
  customerName: string;
  customerEmail: string;
  agentId: string | null;
  agent?: { name: string } | null;
  status: string;
  priority: string;
  notes: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number;
  isRecording: boolean;
  quality: string;
  createdAt: Date;
  updatedAt: Date;
}): Session {
  return {
    id: row.id,
    sessionCode: row.sessionCode,
    inviteCode: row.inviteCode,
    inviteLink: row.inviteLink,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    agentId: row.agentId,
    agentName: row.agent?.name ?? null,
    status: row.status as Session['status'],
    priority: row.priority as Session['priority'],
    notes: row.notes ?? undefined,
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    duration: row.duration,
    isRecording: row.isRecording,
    quality: row.quality as Session['quality'],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSessions(filters?: {
  status?: string[];
  agentId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<Session[]> {
  const where: Record<string, unknown> = {};

  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.agentId) where.agentId = filters.agentId;
  if (filters?.search) {
    where.OR = [
      { sessionCode: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.dateFrom) where.createdAt = { ...(where.createdAt as object), gte: new Date(filters.dateFrom) };
  if (filters?.dateTo) where.createdAt = { ...(where.createdAt as object), lte: new Date(filters.dateTo) };

  const rows = await prisma.session.findMany({
    where,
    include: { agent: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const row = await prisma.session.findUnique({
    where: { id },
    include: { agent: { select: { name: true } } },
  });
  return row ? mapSession(row) : null;
}

export async function getSessionByInviteCode(code: string): Promise<Session | null> {
  const row = await prisma.session.findFirst({
    where: { inviteCode: { equals: code, mode: 'insensitive' } },
    include: { agent: { select: { name: true } } },
  });
  return row ? mapSession(row) : null;
}

export async function createSession(data: {
  customerName: string;
  customerEmail: string;
  agentId: string | null;
  priority: Session['priority'];
  notes?: string;
  baseUrl?: string;
}): Promise<Session> {
  const sessionCode = generateSessionCode();
  const inviteCode = generateInviteCode();
  const base = data.baseUrl || process.env.CLIENT_URL?.split(',')[0] || 'https://relay.app';
  const inviteLink = `${base}/login?code=${inviteCode}`;

  const agent = data.agentId
    ? await prisma.user.findUnique({ where: { id: data.agentId }, select: { name: true } })
    : null;

  const row = await prisma.session.create({
    data: {
      sessionCode,
      inviteCode,
      inviteLink,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      agentId: data.agentId,
      priority: data.priority,
      notes: data.notes,
      status: 'waiting',
    },
    include: { agent: { select: { name: true } } },
  });

  await prisma.activityEvent.create({
    data: {
      text: `New session created for ${data.customerName}`,
      actor: agent?.name ?? 'System',
      type: 'session',
    },
  });

  return mapSession(row);
}

export async function updateSessionStatus(id: string, status: Session['status']): Promise<Session | null> {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return null;

  const updates: Record<string, unknown> = { status };
  if (status === 'live' && !existing.startedAt) updates.startedAt = new Date();
  if (status === 'ended') {
    updates.endedAt = new Date();
    updates.isRecording = false;
    if (existing.startedAt) {
      updates.duration = Math.floor((Date.now() - existing.startedAt.getTime()) / 1000);
    }
  }

  const row = await prisma.session.update({
    where: { id },
    data: updates,
    include: { agent: { select: { name: true } } },
  });
  return mapSession(row);
}

export async function setSessionRecording(id: string, isRecording: boolean): Promise<Session | null> {
  const row = await prisma.session.update({
    where: { id },
    data: { isRecording },
    include: { agent: { select: { name: true } } },
  });
  return mapSession(row);
}

export async function getChat(sessionId: string): Promise<ChatMessage[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    userId: r.userId,
    userName: r.userName,
    role: r.role as ChatMessage['role'],
    content: r.content,
    type: r.type as ChatMessage['type'],
    fileId: r.fileId ?? undefined,
    status: r.status as ChatMessage['status'],
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addChatMessage(data: Omit<ChatMessage, 'id' | 'createdAt' | 'status'>): Promise<ChatMessage> {
  const row = await prisma.chatMessage.create({
    data: {
      sessionId: data.sessionId,
      userId: data.userId,
      userName: data.userName,
      role: data.role,
      content: data.content,
      type: data.type,
      fileId: data.fileId,
      status: 'sent',
    },
  });
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    userName: row.userName,
    role: row.role as ChatMessage['role'],
    content: row.content,
    type: row.type as ChatMessage['type'],
    status: row.status as ChatMessage['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getTimeline(sessionId: string): Promise<TimelineEvent[]> {
  const rows = await prisma.timelineEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    type: r.type as TimelineEvent['type'],
    description: r.description,
    actor: r.actor,
    actorId: r.actorId ?? undefined,
    metadata: (r.metadata as Record<string, string>) ?? undefined,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addTimelineEvent(
  sessionId: string,
  event: Omit<TimelineEvent, 'id' | 'sessionId' | 'createdAt'>
): Promise<TimelineEvent> {
  const row = await prisma.timelineEvent.create({
    data: {
      sessionId,
      type: event.type,
      description: event.description,
      actor: event.actor,
      actorId: event.actorId,
      metadata: event.metadata ?? undefined,
    },
  });
  return {
    id: row.id,
    sessionId: row.sessionId,
    type: row.type as TimelineEvent['type'],
    description: row.description,
    actor: row.actor,
    actorId: row.actorId ?? undefined,
    metadata: (row.metadata as Record<string, string>) ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getFiles(sessionId: string): Promise<SessionFile[]> {
  const rows = await prisma.sessionFile.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    name: r.name,
    size: r.size,
    mimeType: r.mimeType,
    uploadedBy: r.uploadedBy,
    uploadedByName: r.uploadedByName,
    url: r.url,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addFile(data: Omit<SessionFile, 'id' | 'createdAt'> & { storageKey: string }): Promise<SessionFile> {
  const row = await prisma.sessionFile.create({
    data: {
      sessionId: data.sessionId,
      name: data.name,
      size: data.size,
      mimeType: data.mimeType,
      storageKey: data.storageKey,
      url: data.url,
      uploadedBy: data.uploadedBy,
      uploadedByName: data.uploadedByName,
    },
  });
  await addTimelineEvent(data.sessionId, {
    type: 'file_upload',
    description: 'File uploaded',
    actor: data.uploadedByName,
    actorId: data.uploadedBy,
    metadata: { filename: data.name },
  });
  return {
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    size: row.size,
    mimeType: row.mimeType,
    uploadedBy: row.uploadedBy,
    uploadedByName: row.uploadedByName,
    url: row.url,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  const rows = await prisma.participant.findMany({ where: { sessionId } });
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.sessionId,
    userId: r.userId,
    name: r.name,
    email: r.email ?? undefined,
    role: r.role as Participant['role'],
    joinedAt: r.joinedAt.toISOString(),
    leftAt: r.leftAt?.toISOString(),
    inviteCode: r.inviteCode ?? undefined,
    quality: r.quality as Participant['quality'],
  }));
}

export async function addParticipant(data: Omit<Participant, 'id'>): Promise<Participant> {
  const row = await prisma.participant.create({
    data: {
      sessionId: data.sessionId,
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      joinedAt: new Date(data.joinedAt),
      quality: data.quality,
      inviteCode: data.inviteCode,
    },
  });
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    name: row.name,
    email: row.email ?? undefined,
    role: row.role as Participant['role'],
    joinedAt: row.joinedAt.toISOString(),
    quality: row.quality as Participant['quality'],
  };
}

export async function getActivities(): Promise<ActivityEvent[]> {
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const rows = await prisma.activityEvent.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.createdAt.toISOString(),
    text: r.text,
    actor: r.actor,
    type: r.type as ActivityEvent['type'],
  }));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [liveSessions, agentsOnline, todaysSessions, allSessions, recordings] = await Promise.all([
    prisma.session.count({ where: { status: { in: ['live', 'connecting', 'reconnecting'] } } }),
    prisma.user.count({ where: { role: { in: ['agent', 'admin'] }, status: 'online' } }),
    prisma.session.count({ where: { createdAt: { gte: today } } }),
    prisma.session.findMany({ where: { duration: { gt: 0 } }, select: { duration: true } }),
    prisma.recording.findMany({ select: { size: true } }),
  ]);

  const avgDuration = allSessions.length
    ? allSessions.reduce((a, s) => a + s.duration, 0) / allSessions.length
    : 0;
  const storageGb = recordings.reduce((a, r) => a + r.size, 0) / (1024 * 1024);

  const spark = (base: number) =>
    Array.from({ length: 12 }, (_, i) => Math.max(0, Math.round(base + Math.sin(i * 0.8) * (base * 0.15))));

  return {
    activeCalls: liveSessions,
    agentsOnline,
    customersConnected: liveSessions,
    todaysSessions,
    avgCallDuration: Math.round(avgDuration),
    recordingStorage: Math.round(storageGb * 10) / 10,
    trends: { activeCalls: 0, agentsOnline: 0, customersConnected: 0, todaysSessions: 0, avgCallDuration: 0, recordingStorage: 0 },
    sparklines: {
      activeCalls: spark(liveSessions || 1),
      agentsOnline: spark(agentsOnline || 1),
      customersConnected: spark(liveSessions || 1),
      todaysSessions: spark(todaysSessions || 1),
      avgCallDuration: spark(Math.round(avgDuration) || 1),
      recordingStorage: spark(Math.round(storageGb * 10) || 1),
    },
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sessions = await prisma.session.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { status: true, createdAt: true, agentId: true },
  });

  const ended = sessions.filter((s) => s.status === 'ended').length;
  const failed = sessions.filter((s) => s.status === 'failed').length;
  const total = sessions.length || 1;

  const byDay: Record<string, number> = {};
  sessions.forEach((s) => {
    const d = s.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    byDay[d] = (byDay[d] || 0) + 1;
  });

  const byHour: Record<number, number> = {};
  sessions.forEach((s) => {
    const h = s.createdAt.getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });

  const endedSessions = await prisma.session.findMany({
    where: { status: 'ended', createdAt: { gte: sevenDaysAgo }, duration: { gt: 0 } },
    select: { duration: true },
  });
  const avgResolutionTime =
    endedSessions.length > 0
      ? Math.round(endedSessions.reduce((sum, s) => sum + s.duration, 0) / endedSessions.length)
      : 0;

  const recordingCount = await prisma.recording.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });
  const recordingUsage = Math.round((recordingCount / total) * 1000) / 10;

  const peakHourEntry = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  const peakHour = peakHourEntry
    ? new Date(2000, 0, 1, Number(peakHourEntry[0])).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '—';

  const agentStats = await prisma.session.groupBy({
    by: ['agentId'],
    where: { agentId: { not: null }, createdAt: { gte: sevenDaysAgo } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  });
  const agentIds = agentStats.map((a) => a.agentId!).filter(Boolean);
  const agentRows = agentIds.length
    ? await prisma.user.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } })
    : [];
  const agentNames = new Map(agentRows.map((a) => [a.id, a.name]));

  return {
    avgResolutionTime,
    callSuccessRate: Math.round((ended / total) * 1000) / 10,
    recordingUsage,
    peakHour,
    sessionsToday: sessions.filter((s) => s.createdAt >= new Date(new Date().setHours(0, 0, 0, 0))).length,
    sessionsPerDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    volumeByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: byHour[hour] || 0 })),
    successBreakdown: [
      { name: 'Success', value: ended },
      { name: 'Reconnected', value: sessions.filter((s) => s.status === 'reconnecting').length },
      { name: 'Failed', value: failed },
    ],
    topAgents: agentStats.map((a) => ({
      name: agentNames.get(a.agentId!) || 'Unassigned',
      sessions: a._count.id,
    })),
  };
}

export async function tickLiveDurations(): Promise<Session[]> {
  const live = await prisma.session.findMany({
    where: { status: { in: ['live', 'reconnecting'] }, startedAt: { not: null } },
    include: { agent: { select: { name: true } } },
  });

  const updated: Session[] = [];
  for (const row of live) {
    const duration = Math.floor((Date.now() - row.startedAt!.getTime()) / 1000);
    const u = await prisma.session.update({
      where: { id: row.id },
      data: { duration },
      include: { agent: { select: { name: true } } },
    });
    updated.push(mapSession(u));
  }
  return updated;
}
