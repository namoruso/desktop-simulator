'use client';

import type { AppType } from '@/types/window.types';
import { AppIcon } from '@/lib/appIcons';
import { WindowControls } from './WindowControls';

interface WindowTitleBarProps {
  title: string;
  appType: AppType;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export function WindowTitleBar({
  title,
  appType,
  onClose,
  onMinimize,
  onMaximize,
  onDragStart,
}: WindowTitleBarProps) {
  return (
    <div
      className="flex h-10 shrink-0 cursor-default select-none items-center gap-2 border-b border-white/[0.06] bg-black/25 px-3"
      onMouseDown={onDragStart}
    >
      <WindowControls
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
      />
      <div className="flex flex-1 items-center justify-center gap-2 pointer-events-none">
        <AppIcon appType={appType} size={14} className="text-slate-400" />
        <span className="truncate text-xs font-medium text-slate-300">
          {title}
        </span>
      </div>
      <div className="w-[52px]" />
    </div>
  );
}
