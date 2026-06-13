import { prisma } from '../db/client.js';
import type { Recording } from '../../../shared/types.js';

function mapRecording(row: {
  id: string;
  sessionId: string;
  sessionCode: string;
  name: string;
  customerName: string;
  agentName: string;
  duration: number;
  size: number;
  status: string;
  url: string | null;
  createdAt: Date;
}): Recording {
  return {
    id: row.id,
    sessionId: row.sessionId,
    sessionCode: row.sessionCode,
    name: row.name,
    customerName: row.customerName,
    agentName: row.agentName,
    duration: row.duration,
    size: row.size,
    status: row.status as Recording['status'],
    url: row.url ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getRecordings(filters?: { search?: string; status?: string[] }): Promise<Recording[]> {
  const where: Record<string, unknown> = {};
  if (filters?.status?.length) where.status = { in: filters.status };
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sessionCode: { contains: filters.search, mode: 'insensitive' } },
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { agentName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.recording.findMany({ where, orderBy: { createdAt: 'desc' } });
  return rows.map(mapRecording);
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  const row = await prisma.recording.findUnique({ where: { id } });
  return row ? mapRecording(row) : null;
}

export async function getRecordingBySessionId(sessionId: string): Promise<Recording | null> {
  const row = await prisma.recording.findFirst({
    where: { sessionId, status: { in: ['recording', 'processing'] } },
    orderBy: { createdAt: 'desc' },
  });
  return row ? mapRecording(row) : null;
}

export async function createRecording(session: {
  id: string;
  sessionCode: string;
  customerName: string;
  agentName: string | null;
}): Promise<Recording> {
  const row = await prisma.recording.create({
    data: {
      sessionId: session.id,
      sessionCode: session.sessionCode,
      name: `Support ${session.sessionCode.replace('RLY-', '')}`,
      customerName: session.customerName,
      agentName: session.agentName ?? 'Unassigned',
      status: 'recording',
    },
  });
  return mapRecording(row);
}

export async function updateRecording(
  id: string,
  data: { status?: Recording['status']; duration?: number; size?: number; url?: string; storageKey?: string }
): Promise<Recording | null> {
  const row = await prisma.recording.update({ where: { id }, data });
  return mapRecording(row);
}

export async function getStorageUsed(): Promise<{ used: number; total: number }> {
  const agg = await prisma.recording.aggregate({ _sum: { size: true } });
  const usedMb = (agg._sum.size ?? 0) / (1024 * 1024);
  return { used: Math.round(usedMb * 10) / 10, total: 10240 };
}
