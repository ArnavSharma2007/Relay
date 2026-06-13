import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, getSocket, resetSocket } from '@/lib/socket';
import { useUIStore } from '@/store/uiStore';

const BACKOFF = [1000, 2000, 4000, 8000, 16000];
const MAX_ATTEMPTS = 5;

export function useReconnect() {
  const setReconnecting = useUIStore((s) => s.setReconnecting);
  const setReconnectFailed = useUIStore((s) => s.setReconnectFailed);
  const setReconnectRestored = useUIStore((s) => s.setReconnectRestored);
  const attemptRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showRestored = useCallback(() => {
    setReconnectRestored(true);
    dismissRef.current = setTimeout(() => {
      setReconnectRestored(false);
    }, 2500);
  }, [setReconnectRestored]);

  const tryReconnect = useCallback(() => {
    if (attemptRef.current >= MAX_ATTEMPTS) {
      setReconnectFailed(true);
      return;
    }

    attemptRef.current += 1;
    setReconnecting(true, attemptRef.current);

    const delay = BACKOFF[attemptRef.current - 1] || 16000;

    timeoutRef.current = setTimeout(() => {
      resetSocket();
      const socket = connectSocket();

      socket.once('connect', () => {
        attemptRef.current = 0;
        setReconnecting(false);
        showRestored();
      });

      socket.once('connect_error', () => {
        tryReconnect();
      });
    }, delay);
  }, [setReconnecting, setReconnectFailed, showRestored]);

  useEffect(() => {
    const socket = getSocket();

    const onDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') return;
      tryReconnect();
    };

    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('disconnect', onDisconnect);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [tryReconnect]);

  const rejoin = useCallback(() => {
    attemptRef.current = 0;
    setReconnectFailed(false);
    resetSocket();
    connectSocket();
    showRestored();
  }, [setReconnectFailed, showRestored]);

  return { rejoin };
}
