import type { ConnectionQuality } from '@/types';

interface SignalBarsProps {
  quality: ConnectionQuality;
  className?: string;
}

const barColors: Record<ConnectionQuality, string[]> = {
  hd: ['var(--success)', 'var(--success)', 'var(--success)'],
  sd: ['var(--success)', 'var(--warning)', 'var(--subtle)'],
  degraded: ['var(--danger)', 'var(--subtle)', 'var(--subtle)'],
};

export function SignalBars({ quality, className = '' }: SignalBarsProps) {
  const colors = barColors[quality];

  return (
    <svg width="20" height="16" viewBox="0 0 20 16" className={className} aria-label={`Signal quality: ${quality}`}>
      {[4, 7, 10].map((h, i) => (
        <rect
          key={i}
          x={i * 6 + 1}
          y={14 - h}
          width="4"
          height={h}
          rx="1"
          fill={colors[i]}
          opacity={colors[i] === 'var(--subtle)' ? 0.35 : 1}
        />
      ))}
    </svg>
  );
}
