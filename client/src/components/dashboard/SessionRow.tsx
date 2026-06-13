import { motion } from 'motion/react';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { Button } from '@/components/ui/Button';
import { SignalBars } from '@/components/ui/SignalBars';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { formatDuration, useLiveDuration } from '@/hooks/useSession';
import type { Session } from '@/types';
import { Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import api from '@/lib/api';

interface SessionRowProps {
  session: Session;
  index: number;
  compact?: boolean;
}

const statusVariant: Record<Session['status'], 'waiting' | 'connecting' | 'live' | 'reconnecting' | 'ended'> = {
  waiting: 'waiting',
  connecting: 'connecting',
  live: 'live',
  reconnecting: 'reconnecting',
  ended: 'ended',
  failed: 'ended',
};

const statusLabel: Record<Session['status'], string> = {
  waiting: 'Waiting',
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Reconnecting',
  ended: 'Ended',
  failed: 'Failed',
};

export function SessionRow({ session, index, compact }: SessionRowProps) {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const isLive = ['live', 'reconnecting', 'connecting'].includes(session.status);
  const liveDuration = useLiveDuration(session.startedAt, isLive);
  const duration = isLive ? liveDuration : session.duration;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.18) }}
      className="border-b border-[var(--border)] hover:bg-[var(--surface)]/60 transition-colors"
    >
      <td className="table-cell font-mono text-sm text-[var(--text)]">{session.sessionCode}</td>
      <td className="table-cell">
        <div className="text-sm font-medium">{session.customerName}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{session.customerEmail}</div>
      </td>
      <td className="table-cell">
        {session.agentName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[10px] font-semibold">
              {session.agentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-sm">{session.agentName}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--muted)]">Unassigned</span>
        )}
      </td>
      <td className="table-cell">
        <AnimatedBadge
          variant={statusVariant[session.status]}
          showSpinner={session.status === 'reconnecting'}
        >
          {statusLabel[session.status]}
        </AnimatedBadge>
      </td>
      <td className="table-cell font-mono text-sm tabular-nums">{formatDuration(duration)}</td>
      <td className="table-cell">
        {session.isRecording ? (
          <AnimatedBadge variant="recording">Recording</AnimatedBadge>
        ) : (
          <span className="text-[var(--subtle)]">—</span>
        )}
      </td>
      <td className="table-cell">
        <SignalBars quality={session.quality} />
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1.5">
          {session.status !== 'ended' && session.status !== 'failed' && (
            <Button size="sm" onClick={() => navigate(`/call/${session.id}`)}>
              Join
            </Button>
          )}
          {!compact && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/call/${session.id}?monitor=true`)}>
              Monitor
            </Button>
          )}
          <ActionMenu
            items={[
              ...(compact ? [{ label: 'Monitor session', onClick: () => navigate(`/call/${session.id}?monitor=true`) }] : []),
              { label: 'Copy invite code', onClick: () => {
                navigator.clipboard.writeText(session.inviteCode);
                addToast('info', `Invite code copied: ${session.inviteCode}`);
              }},
              { label: 'View history', onClick: () => navigate('/session-history') },
              { label: 'End session', onClick: async () => {
                try {
                  await api.patch(`/sessions/${session.id}/status`, { status: 'ended' });
                  addToast('success', `Ended session ${session.sessionCode}`);
                } catch {
                  addToast('error', `Failed to end session ${session.sessionCode}`);
                }
              }, danger: true },
            ]}
          />
        </div>
      </td>
    </motion.tr>
  );
}

interface SessionsTableProps {
  sessions: Session[];
  onCreateSession?: () => void;
  compact?: boolean;
}

export function SessionsTable({ sessions, onCreateSession, compact }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-14 text-center">
        <Radio size={28} className="text-[var(--muted)] mb-3" strokeWidth={1.5} />
        <p className="text-sm text-[var(--muted)] mb-4 max-w-xs">
          No active sessions right now. Create a session to invite a customer.
        </p>
        {onCreateSession && (
          <Button size="sm" onClick={onCreateSession}>Create Session</Button>
        )}
      </div>
    );
  }

  const displaySessions = compact ? sessions.slice(0, 5) : sessions;

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--panel)]/50 border-b border-[var(--border)]">
            {['Session ID', 'Customer', 'Agent', 'Status', 'Duration', 'Recording', 'Quality', 'Actions'].map((h) => (
              <th key={h} className="table-cell text-left text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displaySessions.map((session, i) => (
            <SessionRow key={session.id} session={session} index={i} compact={compact} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
