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
          'os-interactive os-focus-ring relative flex items-center gap-1 rounded-md px-2 py-1',
          open
            ? 'bg-white/15 text-[var(--text-primary)]'
            : 'text-[var(--text-muted)] hover:bg-white/[0.08] hover:text-[var(--text-primary)]',
          !enabled && 'opacity-50'
        )}
        title={enabled ? 'Notifications' : 'Notifications disabled in Settings'}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="mac-badge absolute -right-0.5 -top-0.5 h-3.5 min-w-[14px] bg-red-500 text-[8px]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="os-glass-popover absolute right-0 top-full z-[200] mt-2 flex max-h-[min(420px,70vh)] w-80 flex-col overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[var(--separator)] px-4 py-3">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
              Notifications
            </h3>
            <div className="flex gap-1">
              {items.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="mac-icon-btn"
                    title="Mark all read"
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="mac-icon-btn"
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
              <li className="px-2 py-8 text-center text-[12px] text-[var(--text-muted)]">
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
                      'mac-list-item mb-1 items-start',
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
                      <span className="block text-[12px]">{n.message}</span>
                      <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                        {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(n.id);
                      }}
                      className="mac-icon-btn shrink-0 p-1"
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
