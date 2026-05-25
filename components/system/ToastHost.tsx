'use client';

import clsx from 'clsx';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastVariant } from '@/store/useToastStore';

const ICONS: Record<ToastVariant, React.ReactNode> = {
  info: <Info size={16} />,
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
};

const VARIANT_DOT: Record<ToastVariant, string> = {
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-[10000] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="os-glass-popover pointer-events-auto flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[12px] toast-enter"
        >
          <span
            className={clsx(
              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
              VARIANT_DOT[t.variant]
            )}
          />
          <span className="mt-0.5 shrink-0 text-[var(--text-muted)]">
            {ICONS[t.variant]}
          </span>
          <p className="min-w-0 flex-1 leading-relaxed text-[var(--text-primary)]">
            {t.message}
          </p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="mac-icon-btn shrink-0 p-0.5"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
