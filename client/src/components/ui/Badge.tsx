type BadgeVariant = 'live' | 'recording' | 'waiting' | 'offline' | 'connecting' | 'reconnecting' | 'ended' | 'processing' | 'ready' | 'failed';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  live: 'bg-[var(--success-dim)] text-[var(--success)]',
  recording: 'bg-[var(--danger-dim)] text-[var(--danger)]',
  waiting: 'bg-[var(--warning-dim)] text-[var(--warning)]',
  offline: 'bg-[var(--panel)] text-[var(--muted)]',
  connecting: 'bg-[var(--primary-dim)] text-[var(--primary)]',
  reconnecting: 'bg-[var(--warning-dim)] text-[var(--warning)]',
  ended: 'bg-[var(--panel)] text-[var(--muted)]',
  processing: 'bg-[var(--warning-dim)] text-[var(--warning)]',
  ready: 'bg-[var(--success-dim)] text-[var(--success)]',
  failed: 'bg-[var(--danger-dim)] text-[var(--danger)]',
};

const showPulse = new Set<BadgeVariant>(['live', 'recording']);

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-semibold uppercase tracking-wider ${styles[variant]} ${className}`}
    >
      {showPulse.has(variant) && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${variant === 'recording' ? 'pulse-dot' : 'pulse-dot'}`} />
      )}
      {children}
    </span>
  );
}
