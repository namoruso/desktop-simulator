'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  ClipboardPaste,
  Copy,
  Folder,
  FolderPlus,
  HardDrive,
  Home,
  RefreshCw,
  Send,
  Usb,
  File,
  ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';
import { useStorageStore } from '@/store/useStorageStore';
import type { StorageDrive, FileEntry } from '@/types/storage.types';
import { Btn, ProgressBar } from '@/components/ui/os-ui';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function driveIcon(type: StorageDrive['type']) {
  if (type === 'usb') return <Usb size={18} className="text-amber-400" />;
  if (type === 'home') return <Home size={18} className="text-sky-400" />;
  return <HardDrive size={18} className="text-slate-400" />;
}

export function FileManager() {
  const snapshot = useStorageStore((s) => s.snapshot);
  const currentPath = useStorageStore((s) => s.currentPath);
  const entries = useStorageStore((s) => s.entries);
  const parentPath = useStorageStore((s) => s.parentPath);
  const selected = useStorageStore((s) => s.selected);
  const clipboard = useStorageStore((s) => s.clipboard);
  const loading = useStorageStore((s) => s.loading);
  const error = useStorageStore((s) => s.error);
  const preview = useStorageStore((s) => s.preview);
  const toast = useStorageStore((s) => s.toast);
  const scan = useStorageStore((s) => s.scan);
  const openPath = useStorageStore((s) => s.openPath);
  const selectEntry = useStorageStore((s) => s.selectEntry);
  const copyToClipboard = useStorageStore((s) => s.copyToClipboard);
  const paste = useStorageStore((s) => s.paste);
  const transferTo = useStorageStore((s) => s.transferTo);
  const mkdir = useStorageStore((s) => s.mkdir);
  const loadPreview = useStorageStore((s) => s.loadPreview);
  const clearToast = useStorageStore((s) => s.clearToast);

  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    void scan();
    // mount-only storage scan
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentPath && snapshot?.drives.length) {
      const home = snapshot.drives.find((d) => d.type === 'home');
      openPath(home?.mount ?? snapshot.drives[0].mount!);
    }
  }, [snapshot, currentPath, openPath]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 4000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const drives = snapshot?.drives ?? [];
  const usbDrives = drives.filter((d) => d.isUSB);

  const handleOpen = (entry: FileEntry) => {
    if (entry.isDirectory) {
      openPath(entry.path);
    } else {
      selectEntry(entry);
      loadPreview(entry);
    }
  };

  const handleMkdir = async () => {
    const name = prompt('New folder name:', 'New Folder');
    if (name) await mkdir(name);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)] text-sm">
      {toast && (
        <div className="shrink-0 border-b border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-xs text-emerald-200">
          {toast}
        </div>
      )}
      {error && (
        <div className="shrink-0 border-b border-red-500/30 bg-red-500/15 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-52 shrink-0 flex-col border-r border-white/10 bg-black/20">
          <div className="border-b border-white/10 px-3 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Locations
            </span>
          </div>
          <ul className="flex-1 overflow-auto p-2 space-y-1">
            {drives.map((drive) => (
              <DriveButton
                key={drive.id}
                drive={drive}
                active={currentPath?.startsWith(drive.mount ?? '') ?? false}
                onOpen={() => drive.mount && openPath(drive.mount)}
              />
            ))}
          </ul>
          {snapshot && (
            <div className="border-t border-white/10 p-3 text-[10px] text-slate-500">
              <p>RAM: {snapshot.physicalRamGB} GB</p>
              <p>
                Swap: {snapshot.swapUsedGB} / {snapshot.swapTotalGB} GB
              </p>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Toolbar
            loading={loading}
            currentPath={currentPath}
            parentPath={parentPath}
            hasClipboard={!!clipboard}
            onUp={() => parentPath && openPath(parentPath)}
            onRefresh={() => {
              scan();
              if (currentPath) openPath(currentPath);
            }}
            onMkdir={handleMkdir}
            onCopy={() => selected && copyToClipboard(selected)}
            onPaste={paste}
            onTransfer={() => setTransferOpen((o) => !o)}
            canCopy={!!selected}
          />

          {transferOpen && (
            <div className="flex flex-wrap gap-2 border-b border-white/10 bg-indigo-500/10 px-3 py-2">
              <span className="w-full text-[10px] font-medium text-indigo-200">
                Send &quot;{selected?.name ?? '…'}&quot; to:
              </span>
              {drives
                .filter((d) => d.mount && d.mount !== currentPath)
                .map((d) => (
                  <Btn
                    key={d.id}
                    variant="primary"
                    onClick={() => {
                      if (d.mount) transferTo(d.mount);
                      setTransferOpen(false);
                    }}
                  >
                    <Send size={12} />
                    {d.label}
                    {d.isUSB && ' (USB)'}
                  </Btn>
                ))}
              {!selected && (
                <span className="text-xs text-slate-500">
                  Select a file or folder first
                </span>
              )}
            </div>
          )}

          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-[3] flex-col border-r border-white/10">
              <div className="truncate border-b border-white/10 px-3 py-1.5 font-mono text-[10px] text-slate-400">
                {currentPath ?? '—'}
              </div>
              <ul className="flex-1 overflow-auto p-1">
                {loading && entries.length === 0 ? (
                  <li className="p-6 text-center text-slate-500">Loading…</li>
                ) : entries.length === 0 ? (
                  <li className="p-6 text-center text-slate-500">Empty folder</li>
                ) : (
                  entries.map((entry) => (
                    <FileRow
                      key={entry.path}
                      entry={entry}
                      selected={selected?.path === entry.path}
                      onClick={() => handleOpen(entry)}
                      onSelect={() => {
                        selectEntry(entry);
                        if (!entry.isDirectory) loadPreview(entry);
                      }}
                    />
                  ))
                )}
              </ul>
            </div>

            <div className="flex min-w-0 flex-[2] flex-col">
              <div className="border-b border-white/10 px-3 py-2 text-xs text-slate-400">
                {selected
                  ? `${selected.name} · ${selected.isDirectory ? 'Folder' : formatSize(selected.size)}`
                  : 'Select an item'}
              </div>
              <pre className="flex-1 overflow-auto p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                {selected?.isDirectory
                  ? `Folder: ${selected.path}\n\n${entries.length} items`
                  : preview ?? 'Text preview for files under 2 MB'}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {usbDrives.length > 0 && (
        <footer className="flex shrink-0 items-center gap-2 border-t border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <Usb size={14} />
          USB detected: {usbDrives.map((d) => d.label).join(', ')} — use Send to copy files
        </footer>
      )}
    </div>
  );
}

function DriveButton({
  drive,
  active,
  onOpen,
}: {
  drive: StorageDrive;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={!drive.mount}
        className={clsx(
          'w-full rounded-lg px-2 py-2 text-left transition',
          active && 'bg-[var(--accent)]/25 ring-1 ring-[var(--accent)]/50',
          drive.isUSB && !active && 'ring-1 ring-amber-500/30 hover:bg-amber-500/10',
          !active && !drive.isUSB && 'hover:bg-white/5'
        )}
      >
        <div className="flex items-center gap-2">
          {driveIcon(drive.type)}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-slate-200">
              {drive.label}
            </div>
            <div className="truncate font-mono text-[9px] text-slate-500">
              {drive.mount}
            </div>
          </div>
        </div>
        {drive.totalGB > 0 && (
          <div className="mt-2">
            <ProgressBar percent={drive.usedPercent} />
            <p className="mt-1 text-[9px] text-slate-500">
              {drive.freeGB} GB free of {drive.totalGB} GB
            </p>
          </div>
        )}
      </button>
    </li>
  );
}

function Toolbar({
  loading,
  currentPath,
  parentPath,
  hasClipboard,
  onUp,
  onRefresh,
  onMkdir,
  onCopy,
  onPaste,
  onTransfer,
  canCopy,
}: {
  loading: boolean;
  currentPath: string | null;
  parentPath: string | null;
  hasClipboard: boolean;
  onUp: () => void;
  onRefresh: () => void;
  onMkdir: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onTransfer: () => void;
  canCopy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-2 py-2">
      <ToolIcon
        icon={<ChevronUp size={16} />}
        title="Up"
        disabled={!parentPath}
        onClick={onUp}
      />
      <ToolIcon
        icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
        title="Refresh"
        onClick={onRefresh}
      />
      <ToolIcon icon={<FolderPlus size={16} />} title="New folder" onClick={onMkdir} />
      <div className="mx-1 h-5 w-px bg-white/10" />
      <ToolIcon icon={<Copy size={16} />} title="Copy" disabled={!canCopy} onClick={onCopy} />
      <ToolIcon
        icon={<ClipboardPaste size={16} />}
        title="Paste"
        disabled={!hasClipboard || !currentPath}
        onClick={onPaste}
      />
      <Btn variant="primary" onClick={onTransfer} title="Copy to another drive">
        <Send size={14} />
        Send to…
      </Btn>
    </div>
  );
}

function ToolIcon({
  icon,
  title,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
    >
      {icon}
    </button>
  );
}

function FileRow({
  entry,
  selected,
  onClick,
  onSelect,
}: {
  entry: FileEntry;
  selected: boolean;
  onClick: () => void;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onClick}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition',
          selected ? 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]/40' : 'hover:bg-white/5'
        )}
      >
        {entry.isDirectory ? (
          <Folder size={18} className="shrink-0 text-amber-400/90" />
        ) : (
          <File size={18} className="shrink-0 text-slate-400" />
        )}
        <span className="min-w-0 flex-1 truncate">{entry.name}</span>
        <span className="text-[10px] text-slate-500">
          {entry.isDirectory ? '' : formatSize(entry.size)}
        </span>
        <span className="hidden text-[10px] text-slate-600 sm:inline">
          {format(new Date(entry.modified), 'MMM d HH:mm')}
        </span>
      </button>
    </li>
  );
}
