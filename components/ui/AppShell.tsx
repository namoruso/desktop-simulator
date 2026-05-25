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
    <div
      className={clsx(
        'relative flex h-full min-h-0 flex-col bg-[var(--app-bg)] text-[13px] text-[var(--text-primary)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function AppToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('mac-toolbar', className)}>{children}</div>
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
        'mac-icon-btn',
        active && 'mac-icon-btn-active',
        disabled && 'cursor-not-allowed opacity-30'
      )}
    >
      {children}
    </button>
  );
}
