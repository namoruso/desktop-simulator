'use client';

import clsx from 'clsx';
import type { AppType } from '@/types/window.types';
import { AppIcon } from '@/lib/appIcons';
import { WindowControls } from './WindowControls';

interface WindowTitleBarProps {
  title: string;
  appType: AppType;
  focused?: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export function WindowTitleBar({
  title,
  appType,
  focused = true,
  onClose,
  onMinimize,
  onMaximize,
  onDragStart,
}: WindowTitleBarProps) {
  return (
    <div
      className={clsx(
        'flex h-[28px] shrink-0 cursor-default select-none items-center gap-2 border-b px-3',
        focused
          ? 'border-[var(--separator)] bg-[rgba(255,255,255,0.04)]'
          : 'border-[var(--separator)] bg-[rgba(0,0,0,0.15)]'
      )}
      onMouseDown={onDragStart}
    >
      <WindowControls
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
      />
      <div className="pointer-events-none flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <AppIcon
          appType={appType}
          size={13}
          className={focused ? 'text-[var(--text-muted)]' : 'text-[var(--text-subtle)]'}
        />
        <span
          className={clsx(
            'truncate text-[13px] font-medium',
            focused ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
          )}
        >
          {title}
        </span>
      </div>
      <div className="w-[58px] shrink-0" aria-hidden />
    </div>
  );
}
