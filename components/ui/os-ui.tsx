'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-white/10 bg-black/25 shadow-inner',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
      {children}
    </h3>
  );
}

export function SettingRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-7 w-12 rounded-full transition-colors',
        checked ? 'bg-[var(--accent)]' : 'bg-slate-600'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={clsx(
        'h-2 overflow-hidden rounded-full bg-black/40',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'default',
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40',
        variant === 'primary' &&
          'bg-[var(--accent)] text-white hover:brightness-110',
        variant === 'danger' &&
          'border border-red-500/40 text-red-400 hover:bg-red-500/10',
        variant === 'default' &&
          'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}
