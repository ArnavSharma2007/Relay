import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { connectSocket, resetSocket } from '@/lib/socket';

export function ReconnectBanner() {
  const reconnecting = useUIStore((s) => s.reconnecting);
  const reconnectAttempt = useUIStore((s) => s.reconnectAttempt);
  const reconnectFailed = useUIStore((s) => s.reconnectFailed);
  const reconnectRestored = useUIStore((s) => s.reconnectRestored);
  const setReconnectFailed = useUIStore((s) => s.setReconnectFailed);
  const setReconnectRestored = useUIStore((s) => s.setReconnectRestored);

  const handleRejoin = () => {
    setReconnectFailed(false);
    resetSocket();
    connectSocket();
    setReconnectRestored(true);
    setTimeout(() => setReconnectRestored(false), 2500);
  };

  const show = reconnecting || reconnectFailed || reconnectRestored;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2.5 ${
            reconnectFailed
              ? 'bg-[var(--danger-dim)] border-b border-[var(--danger)]'
              : reconnectRestored
                ? 'bg-[var(--success-dim)] border-b border-[var(--success)]'
                : 'bg-[var(--panel)] border-b border-[var(--border)] border-l-4 border-l-[var(--warning)]'
          }`}
        >
          {reconnectFailed ? (
            <>
              <span className="text-sm text-[var(--danger)]">
                Session disconnected. You may attempt to rejoin.
              </span>
              <Button variant="danger" size="sm" onClick={handleRejoin}>
                Rejoin Session
              </Button>
            </>
          ) : reconnectRestored ? (
            <>
              <CheckCircle size={15} className="text-[var(--success)]" />
              <span className="text-sm text-[var(--success)] font-medium">Connection restored</span>
            </>
          ) : (
            <>
              <Loader2 size={15} className="spinner text-[var(--warning)]" />
              <span className="text-sm text-[var(--text)]">
                Reconnecting... Attempt {reconnectAttempt} of 5
              </span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
