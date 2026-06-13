import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { SparkLine } from './SparkLine';
import { useCountTo } from '@/hooks/useSession';

interface MetricCardProps {
  label: string;
  value: number;
  trend: number;
  sparkData: number[];
  color: string;
  icon: LucideIcon;
  format?: 'number' | 'duration' | 'storage';
  index: number;
}

export function MetricCard({ label, value, trend, sparkData, color, icon: Icon, format = 'number', index }: MetricCardProps) {
  const animatedValue = useCountTo(Math.round(value));

  const displayValue = () => {
    if (format === 'duration') {
      const m = Math.floor(animatedValue / 60);
      const s = animatedValue % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    if (format === 'storage') return `${value.toFixed(1)} GB`;
    return animatedValue.toLocaleString();
  };

  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ scale: 1.01 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] px-6 py-5 cursor-default"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-8 h-8 rounded-[6px] flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <SparkLine data={sparkData} color={color} />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight">{displayValue()}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-xs text-[var(--muted)] font-medium">{label}</p>
          <span className={`flex items-center gap-0.5 text-[11px] font-medium tabular-nums ${isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
