'use client';

import { useEffect, useState, useCallback } from 'react';
import { Terminal, FolderOpen, Settings } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScheduler } from '@/hooks/useScheduler';
import { useOSLifecycle } from '@/hooks/useOSLifecycle';
import { useThemeSettings } from '@/hooks/useThemeSettings';
import { useHostAudio } from '@/hooks/useHostAudio';
import { useOSStore } from '@/store/useOSStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useStorageStore } from '@/store/useStorageStore';
import { MenuBar } from '@/components/desktop/MenuBar';
import { Dock } from '@/components/desktop/Dock';
import { DesktopIcons } from '@/components/desktop/DesktopIcons';
import { WindowManager } from '@/components/window-manager/WindowManager';
import { Spotlight } from '@/components/desktop/Spotlight';
import { ToastHost } from '@/components/system/ToastHost';
import { ConnectionBanner } from '@/components/system/ConnectionBanner';
import { launchApp } from '@/lib/launchApp';

export function Desktop() {
  useWebSocket();
  useScheduler();
  useOSLifecycle();
  useThemeSettings();
  useHostAudio();
  const tickUptime = useOSStore((s) => s.tickUptime);
  const scanNet = useNetworkStore((s) => s.scan);
  const scanStorage = useStorageStore((s) => s.scan);
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
    null
  );
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const toggleSpotlight = useCallback(() => {
    setSpotlightOpen((o) => !o);
  }, []);

  useEffect(() => {
    scanNet();
    scanStorage();
    const id = setInterval(tickUptime, 1000);
    return () => clearInterval(id);
  }, [tickUptime, scanNet, scanStorage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const wallpaperClass =
    wallpaper === 'mountains'
      ? 'desktop-wallpaper-mountains'
      : wallpaper === 'solid'
        ? 'desktop-wallpaper-solid'
        : wallpaper === 'gradient'
          ? 'desktop-wallpaper-gradient'
          : 'desktop-wallpaper-aurora';

  return (
    <div
      className="desktop-surface relative flex h-screen w-screen flex-col overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }}
      onClick={() => setContextMenu(null)}
    >
      <div className={wallpaperClass} aria-hidden />
      <div className="desktop-vignette pointer-events-none absolute inset-0" aria-hidden />

      <MenuBar onSpotlight={toggleSpotlight} />
      <ConnectionBanner />
      <div className="relative min-h-0 flex-1">
        <DesktopIcons />
        <WindowManager />
      </div>
      <Dock />

      <ToastHost />

      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

function ContextMenu({
  x,
  y,
  onClose,
}: {
  x: number;
  y: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[rgba(22,26,38,0.97)] py-1 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <CtxItem
        icon={<Terminal size={16} />}
        label="Open Terminal"
        onClick={() => {
          launchApp('terminal');
          onClose();
        }}
      />
      <CtxItem
        icon={<FolderOpen size={16} />}
        label="Open File Manager"
        onClick={() => {
          launchApp('file-manager');
          onClose();
        }}
      />
      <CtxItem
        icon={<Settings size={16} />}
        label="Settings"
        onClick={() => {
          launchApp('settings');
          onClose();
        }}
      />
    </div>
  );
}

function CtxItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/10"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
