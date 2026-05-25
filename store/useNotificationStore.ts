import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ToastVariant } from '@/store/useToastStore';

export interface NotificationItem {
  id: string;
  message: string;
  variant: ToastVariant;
  timestamp: number;
  read: boolean;
}

const MAX_ITEMS = 50;

interface NotificationStore {
  items: NotificationItem[];
  add: (message: string, variant: ToastVariant) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

let seq = 0;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (message, variant) => {
        const id = `notif-${++seq}-${Date.now()}`;
        set((s) => ({
          items: [
            { id, message, variant, timestamp: Date.now(), read: false },
            ...s.items,
          ].slice(0, MAX_ITEMS),
        }));
      },
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((n) => ({ ...n, read: true })),
        })),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((n) => n.id !== id) })),
      clearAll: () => set({ items: [] }),
      unreadCount: () => get().items.filter((n) => !n.read).length,
    }),
    {
      name: 'webos-notifications-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);
