'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ToastVariant } from '@/store/useToastStore';

const VARIANT_DOT: Record<ToastVariant, string> = {
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useSettingsStore((s) => s.notificationsEnabled);
  const items = useNotificationStore((s) => s.items);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'relative flex items-center gap-1 rounded-md px-2 py-1 transition',
          open ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
          !enabled && 'opacity-50'
        )}
        title={enabled ? 'Notifications' : 'Notifications disabled in Settings'}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-2 flex max-h-[min(420px,70vh)] w-80 flex-col overflow-hidden rounded-xl border border-white/10 bg-[rgba(18,22,32,0.98)] shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex gap-1">
              {items.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Mark all read"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                    title="Clear all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {!enabled && (
            <p className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] text-amber-200">
              Notifications are off. Enable in Settings → Notifications.
            </p>
          )}

          <ul className="flex-1 overflow-auto p-2">
            {items.length === 0 ? (
              <li className="px-2 py-8 text-center text-xs text-slate-500">
                No notifications yet
              </li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => markRead(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') markRead(n.id);
                    }}
                    className={clsx(
                      'mb-1 flex w-full cursor-pointer gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-white/5',
                      !n.read && 'bg-white/[0.04]'
                    )}
                  >
                    <span
                      className={clsx(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        VARIANT_DOT[n.variant]
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-slate-200">{n.message}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      className="shrink-0 rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                      aria-label="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
