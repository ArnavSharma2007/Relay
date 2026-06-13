import { create } from 'zustand';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  toasts: Toast[];
  notifications: { id: string; text: string; read: boolean; timestamp: string }[];
  reconnecting: boolean;
  reconnectAttempt: number;
  reconnectFailed: boolean;
  reconnectRestored: boolean;
  showChatPanel: boolean;
  toggleSidebar: () => void;
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  addNotification: (text: string) => void;
  markAllRead: () => void;
  setReconnecting: (reconnecting: boolean, attempt?: number) => void;
  setReconnectFailed: (failed: boolean) => void;
  setReconnectRestored: (restored: boolean) => void;
  setShowChatPanel: (show: boolean) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toasts: [],
  notifications: [],
  reconnecting: false,
  reconnectAttempt: 0,
  reconnectFailed: false,
  reconnectRestored: false,
  showChatPanel: true,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  addToast: (type, message) =>
    set((state) => {
      const id = `toast-${++toastCounter}`;
      const toasts = [...state.toasts, { id, type, message }].slice(-3);
      return { toasts };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  addNotification: (text) =>
    set((state) => ({
      notifications: [
        { id: `notif-${Date.now()}`, text, read: false, timestamp: new Date().toISOString() },
        ...state.notifications,
      ].slice(0, 20),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  setReconnecting: (reconnecting, attempt = 0) =>
    set({ reconnecting, reconnectAttempt: attempt, reconnectFailed: false, reconnectRestored: false }),
  setReconnectFailed: (failed) => set({ reconnectFailed: failed, reconnecting: false, reconnectRestored: false }),
  setReconnectRestored: (restored) => set({ reconnectRestored: restored, reconnecting: false }),
  setShowChatPanel: (show) => set({ showChatPanel: show }),
}));
