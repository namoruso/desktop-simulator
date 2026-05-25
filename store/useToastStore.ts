import { create } from 'zustand';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

let seq = 0;
let lastPush = { message: '', at: 0 };

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, variant = 'info') => {
    const now = Date.now();
    if (message === lastPush.message && now - lastPush.at < 4000) return;
    lastPush = { message, at: now };

    useNotificationStore.getState().add(message, variant);
    if (!useSettingsStore.getState().notificationsEnabled) return;

    const id = `toast-${++seq}-${now}`;
    set((s) => {
      const filtered = s.toasts.filter((t) => t.message !== message);
      return { toasts: [...filtered, { id, message, variant }] };
    });
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
