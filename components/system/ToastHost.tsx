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

const STYLES: Record<ToastVariant, string> = {
  info: 'border-sky-500/30 bg-sky-500/15 text-sky-100',
  success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100',
  error: 'border-red-500/30 bg-red-500/15 text-red-100',
  warning: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
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
          className={clsx(
            'pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-xl backdrop-blur-xl toast-enter',
            STYLES[t.variant]
          )}
        >
          <span className="mt-0.5 shrink-0">{ICONS[t.variant]}</span>
          <p className="min-w-0 flex-1 leading-relaxed">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
