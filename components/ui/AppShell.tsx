'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('relative flex h-full flex-col bg-[var(--app-bg)] text-sm', className)}>
      {children}
    </div>
  );
}

export function ToolbarButton({
  children,
  onClick,
  title,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'rounded-lg p-2 transition disabled:opacity-30',
        active
          ? 'bg-[var(--accent)]/25 text-white'
          : 'text-slate-400 hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  );
}
