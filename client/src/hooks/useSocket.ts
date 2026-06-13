import { useEffect, useCallback } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';
import { useSessionStore } from '@/store/sessionStore';
import { useCallStore } from '@/store/callStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { Session } from '@/types';

export function useSocket() {
  const updateSession = useSessionStore((s) => s.updateSession);
  const addChatMessage = useSessionStore((s) => s.addChatMessage);
  const addTimelineEvent = useSessionStore((s) => s.addTimelineEvent);
  const setTyping = useSessionStore((s) => s.setTyping);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('session:update', ({ session }: { session: Session }) => {
      updateSession(session);
    });

    socket.on('chat:message', ({ message }) => {
      addChatMessage(message);
    });

    socket.on('chat:typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setTyping(userId, isTyping);
      if (isTyping) {
        setTimeout(() => setTyping(userId, false), 3000);
      }
    });

    socket.on('timeline:event', ({ event }) => {
      addTimelineEvent(event);
    });

    socket.on('file:added', ({ file }) => {
      useSessionStore.getState().addFile(file);
    });

    return () => {
      socket.off('session:update');
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('timeline:event');
      socket.off('file:added');
    };
  }, [updateSession, addChatMessage, addTimelineEvent, setTyping]);

  const emit = useCallback((event: string, data?: unknown) => {
    getSocket().emit(event, data);
  }, []);

  return { emit, socket: getSocket() };
}

export function useSessionSocket(sessionId?: string) {
  const { emit, socket } = useSocket();
  const setRecording = useCallStore((s) => s.setRecording);
  const addNotification = useUIStore((s) => s.addNotification);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!sessionId || !user) return;

    socket.emit('session:join', { sessionId, userId: user.id, role: user.role });

    socket.on('recording:status', ({ status }: { sessionId: string; status: string }) => {
      setRecording(status === 'recording');
      if (status === 'recording') {
        addNotification('Recording started for this session');
      }
    });

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.off('recording:status');
    };
  }, [sessionId, socket, setRecording, addNotification, user]);

  const sendMessage = useCallback(
    (content: string, type = 'text') => {
      if (!sessionId) return;
      emit('chat:message', { sessionId, content, type });
    },
    [sessionId, emit]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!sessionId) return;
      emit('chat:typing', { sessionId, isTyping });
    },
    [sessionId, emit]
  );

  const startRecording = useCallback(() => {
    if (!sessionId) return;
    emit('recording:start', { sessionId });
  }, [sessionId, emit]);

  const stopRecording = useCallback(() => {
    if (!sessionId) return;
    emit('recording:stop', { sessionId });
  }, [sessionId, emit]);

  return { sendMessage, sendTyping, startRecording, stopRecording, socket };
}
