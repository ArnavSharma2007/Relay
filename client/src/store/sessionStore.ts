import { create } from 'zustand';
import type { Session, ChatMessage, TimelineEvent, SessionFile } from '@/types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  chatMessages: ChatMessage[];
  timelineEvents: TimelineEvent[];
  files: SessionFile[];
  typingUsers: Record<string, boolean>;
  setSessions: (sessions: Session[]) => void;
  updateSession: (session: Session) => void;
  setCurrentSession: (session: Session | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  setTimelineEvents: (events: TimelineEvent[]) => void;
  setFiles: (files: SessionFile[]) => void;
  addFile: (file: SessionFile) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  chatMessages: [],
  timelineEvents: [],
  files: [],
  typingUsers: {},
  setSessions: (sessions) => set({ sessions }),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
      currentSession: state.currentSession?.id === session.id ? session : state.currentSession,
    })),
  setCurrentSession: (session) => set({ currentSession: session }),
  addChatMessage: (message) =>
    set((state) => {
      const existing = state.chatMessages.findIndex((m) => m.id === message.id);
      if (existing >= 0) {
        const updated = [...state.chatMessages];
        updated[existing] = message;
        return { chatMessages: updated };
      }
      return { chatMessages: [...state.chatMessages, message] };
    }),
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addTimelineEvent: (event) =>
    set((state) => ({ timelineEvents: [...state.timelineEvents, event] })),
  setTimelineEvents: (events) => set({ timelineEvents: events }),
  setFiles: (files) => set({ files }),
  addFile: (file) => set((state) => ({ files: [...state.files, file] })),
  setTyping: (userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    })),
}));
