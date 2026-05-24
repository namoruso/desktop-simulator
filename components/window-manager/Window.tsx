'use client';

import { useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import type { WindowInstance } from '@/types/window.types';
import { useWindowStore } from '@/store/useWindowStore';
import { WindowTitleBar } from './WindowTitleBar';

const TaskManager = dynamic(
  () => import('@/components/apps/TaskManager/TaskManager').then((m) => m.TaskManager),
  { ssr: false, loading: () => <AppLoading /> }
);
const Terminal = dynamic(
  () => import('@/components/apps/Terminal/Terminal').then((m) => m.Terminal),
  { ssr: false, loading: () => <AppLoading /> }
);
const TextEditor = dynamic(
  () => import('@/components/apps/TextEditor/TextEditor').then((m) => m.TextEditor),
  { ssr: false, loading: () => <AppLoading /> }
);
const Calculator = dynamic(
  () => import('@/components/apps/Calculator/Calculator').then((m) => m.Calculator),
  { ssr: false, loading: () => <AppLoading /> }
);
const Browser = dynamic(
  () => import('@/components/apps/Browser/Browser').then((m) => m.Browser),
  { ssr: false, loading: () => <AppLoading /> }
);
const FileManager = dynamic(
  () => import('@/components/apps/FileManager/FileManager').then((m) => m.FileManager),
  { ssr: false, loading: () => <AppLoading /> }
);
const Settings = dynamic(
  () => import('@/components/apps/Settings/Settings').then((m) => m.Settings),
  { ssr: false, loading: () => <AppLoading /> }
);

function AppLoading() {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-slate-500">
      Loading…
    </div>
  );
}

function AppContent({ appType }: { appType: WindowInstance['appType'] }) {
  switch (appType) {
    case 'task-manager':
      return <TaskManager />;
    case 'terminal':
      return <Terminal />;
    case 'text-editor':
      return <TextEditor />;
    case 'calculator':
      return <Calculator />;
    case 'browser':
      return <Browser />;
    case 'file-manager':
      return <FileManager />;
    case 'settings':
      return <Settings />;
    default:
      return null;
  }
}

interface WindowProps {
  window: WindowInstance;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function Window({ window: win, containerRef }: WindowProps) {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updatePosition,
    updateSize,
  } = useWindowStore();

  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, wx: 0, wy: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      if (win.isMaximized) return;
      e.preventDefault();
      dragging.current = true;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        wx: win.position.x,
        wy: win.position.y,
      };
      focusWindow(win.id);
    },
    [win, focusWindow]
  );

  const onResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (win.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      resizing.current = true;
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: win.size.width,
        h: win.size.height,
      };
      focusWindow(win.id);
    },
    [win, focusWindow]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (dragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        let nx = dragStart.current.wx + dx;
        let ny = dragStart.current.wy + dy;
        nx = Math.max(0, Math.min(nx, container.clientWidth - 120));
        ny = Math.max(0, Math.min(ny, container.clientHeight - 48));
        updatePosition(win.id, { x: nx, y: ny });
      }

      if (resizing.current) {
        const dw = e.clientX - resizeStart.current.x;
        const dh = e.clientY - resizeStart.current.y;
        updateSize(win.id, {
          width: Math.max(320, resizeStart.current.w + dw),
          height: Math.max(200, resizeStart.current.h + dh),
        });
      }
    };

    const onUp = () => {
      dragging.current = false;
      resizing.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [win.id, containerRef, updatePosition, updateSize]);

  if (win.isMinimized) return null;

  const maximized = win.isMaximized;

  return (
    <div
      role="dialog"
      aria-label={win.title}
      className={clsx(
        'glass-window window-enter flex flex-col overflow-hidden rounded-xl',
        win.isFocused && 'focused',
        maximized ? 'absolute inset-3' : 'absolute'
      )}
      style={
        maximized
          ? { zIndex: win.zIndex }
          : {
              zIndex: win.zIndex,
              left: win.position.x,
              top: win.position.y,
              width: win.size.width,
              height: win.size.height,
            }
      }
      onMouseDown={() => focusWindow(win.id)}
    >
      <WindowTitleBar
        title={win.title}
        appType={win.appType}
        onClose={() => closeWindow(win.id)}
        onMinimize={() => minimizeWindow(win.id)}
        onMaximize={() => maximizeWindow(win.id)}
        onDragStart={onDragStart}
      />
      <div className="app-chrome min-h-0 flex-1 overflow-hidden">
        <AppContent appType={win.appType} />
      </div>
      {!maximized && (
        <div
          className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-se-resize"
          onMouseDown={onResizeStart}
          aria-hidden
        />
      )}
    </div>
  );
}
