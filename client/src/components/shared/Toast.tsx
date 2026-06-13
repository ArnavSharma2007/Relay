import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { useUIStore, ToastType } from '@/store/uiStore';

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-[var(--success)]',
  warning: 'border-l-[var(--warning)]',
  error: 'border-l-[var(--danger)]',
  info: 'border-l-[var(--primary)]',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  error: 'text-[var(--danger)]',
  info: 'text-[var(--primary)]',
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 4000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.95 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-3 p-3 border-l-2 ${borders[type]} max-w-[360px] cursor-pointer rounded-[var(--radius)]`}
      style={{
        background: 'rgba(13, 15, 26, 0.92)',
        border: '1px solid rgba(124,92,252,0.18)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={() => removeToast(id)}
    >
      <Icon size={16} className={`mt-0.5 flex-shrink-0 ${iconColors[type]}`} />
      <p className="text-sm flex-1" style={{ color: 'var(--text)' }}>{message}</p>
      <button onClick={() => removeToast(id)} style={{ color: 'var(--muted)' }}>
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
