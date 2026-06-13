import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Badge } from './Badge';

type BadgeVariant = 'live' | 'recording' | 'waiting' | 'offline' | 'connecting' | 'reconnecting' | 'ended' | 'processing' | 'ready' | 'failed';

interface AnimatedBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  showSpinner?: boolean;
}

export function AnimatedBadge({ variant, children, showSpinner }: AnimatedBadgeProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={`${variant}-${children}`}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: [0.8, 1, 0.8, 1] }}
        transition={{ duration: 0.3 }}
        className="inline-flex"
      >
        <Badge variant={variant}>
          {showSpinner && <Loader2 size={10} className="spinner" />}
          {children}
        </Badge>
      </motion.span>
    </AnimatePresence>
  );
}
