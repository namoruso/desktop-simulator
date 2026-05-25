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
  Pencil,
  Trash2,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  FileType,
} from 'lucide-react';
import clsx from 'clsx';
import { useStorageStore } from '@/store/useStorageStore';
import type { StorageDrive, FileEntry } from '@/types/storage.types';
import { Btn, ProgressBar } from '@/components/ui/os-ui';
import { AppShell } from '@/components/ui/AppShell';
import { ConfirmDialog, PromptDialog } from '@/components/ui/OSDialog';
import { openFileInEditor, isEditableTextFile } from '@/lib/editorBridge';
import { openFileInImageViewer, openFileInPdfViewer } from '@/lib/mediaBridge';
import { getRawFileUrl, isImageFile, isPdfFile } from '@/lib/fileTypes';

type FileDialog =
  | { kind: 'mkdir' }
  | { kind: 'rename' }
  | { kind: 'delete'; name: string };

function validateFileName(name: string): string | null {
  if (/[/\\]/.test(name)) return 'Name cannot contain / or \\';
  if (name === '.' || name === '..') return 'Invalid name';
  return null;
}

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
  const scan = useStorageStore((s) => s.scan);
  const openPath = useStorageStore((s) => s.openPath);
  const selectEntry = useStorageStore((s) => s.selectEntry);
  const copyToClipboard = useStorageStore((s) => s.copyToClipboard);
  const paste = useStorageStore((s) => s.paste);
  const transferTo = useStorageStore((s) => s.transferTo);
  const mkdir = useStorageStore((s) => s.mkdir);
  const removeSelected = useStorageStore((s) => s.removeSelected);
  const renameSelected = useStorageStore((s) => s.renameSelected);
  const moveEntry = useStorageStore((s) => s.moveEntry);
  const uploadFiles = useStorageStore((s) => s.uploadFiles);
  const loadPreview = useStorageStore((s) => s.loadPreview);

  const [transferOpen, setTransferOpen] = useState(false);
  const [initDone, setInitDone] = useState(false);
  const [dialog, setDialog] = useState<FileDialog | null>(null);
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [hostDragOver, setHostDragOver] = useState(false);

  useEffect(() => {
    if (initDone || currentPath || !snapshot?.drives.length) return;
    const target =
      snapshot.userHome ??
      snapshot.drives.find((d) => d.type === 'home')?.mount ??
      snapshot.drives.find((d) => d.label === 'Home')?.mount ??
      snapshot.drives[0]?.mount;
    if (!target) return;
    setInitDone(true);
    void openPath(target);
  }, [snapshot, currentPath, openPath, initDone]);

  const drives = snapshot?.drives ?? [];
  const usbDrives = drives.filter((d) => d.isUSB);

  const handleOpen = (entry: FileEntry) => {
    if (entry.isDirectory) {
      openPath(entry.path);
    } else if (isEditableTextFile(entry.name, entry.size)) {
      openFileInEditor(entry.path);
    } else if (isImageFile(entry.name, entry.size)) {
      openFileInImageViewer(entry.path);
    } else if (isPdfFile(entry.name, entry.size)) {
      openFileInPdfViewer(entry.path);
    } else {
      selectEntry(entry);
      loadPreview(entry);
    }
  };

  const handleOpenInEditor = () => {
    if (selected && !selected.isDirectory && isEditableTextFile(selected.name, selected.size)) {
      openFileInEditor(selected.path);
    }
  };

  const handleOpenInImageViewer = () => {
    if (selected && !selected.isDirectory && isImageFile(selected.name, selected.size)) {
      openFileInImageViewer(selected.path);
    }
  };

  const handleOpenInPdfViewer = () => {
    if (selected && !selected.isDirectory && isPdfFile(selected.name, selected.size)) {
      openFileInPdfViewer(selected.path);
    }
  };

  const closeDialog = () => setDialog(null);

  const handleDropOnFolder = (targetDir: string) => {
    if (!dragPath || dragPath === targetDir) return;
    if (targetDir.startsWith(`${dragPath}/`) || targetDir === dragPath) return;
    void moveEntry(dragPath, targetDir);
    setDragPath(null);
    setDropTarget(null);
  };

  const handleMkdir = () => setDialog({ kind: 'mkdir' });

  const handleRename = () => {
    if (selected) setDialog({ kind: 'rename' });
  };

  const handleDelete = () => {
    if (selected) setDialog({ kind: 'delete', name: selected.name });
  };

  const isHostFileDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes('Files');

  const handleHostDragOver = (e: React.DragEvent) => {
    if (!isHostFileDrag(e) || !currentPath) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHostDragOver(true);
  };

  const handleHostDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setHostDragOver(false);
  };

  const handleHostDrop = (e: React.DragEvent) => {
    if (!isHostFileDrag(e) || !currentPath) return;
    e.preventDefault();
    setHostDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) void uploadFiles(files, currentPath);
  };

  return (
    <AppShell>
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
              void scan({ silent: true });
              if (currentPath) void openPath(currentPath);
            }}
            onMkdir={handleMkdir}
            onCopy={() => selected && copyToClipboard(selected)}
            onPaste={paste}
            onTransfer={() => setTransferOpen((o) => !o)}
            onRename={handleRename}
            onDelete={handleDelete}
            onOpenInEditor={handleOpenInEditor}
            onOpenInImageViewer={handleOpenInImageViewer}
            onOpenInPdfViewer={handleOpenInPdfViewer}
            canOpenInEditor={
              !!selected &&
              !selected.isDirectory &&
              isEditableTextFile(selected.name, selected.size)
            }
            canOpenInImageViewer={
              !!selected &&
              !selected.isDirectory &&
              isImageFile(selected.name, selected.size)
            }
            canOpenInPdfViewer={
              !!selected &&
              !selected.isDirectory &&
              isPdfFile(selected.name, selected.size)
            }
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
            <div
              className="relative flex min-w-0 flex-[3] flex-col border-r border-white/10"
              onDragOver={handleHostDragOver}
              onDragLeave={handleHostDragLeave}
              onDrop={handleHostDrop}
            >
              <div className="truncate border-b border-white/10 px-3 py-1.5 font-mono text-[10px] text-slate-400">
                {currentPath ?? '—'}
                {hostDragOver && (
                  <span className="ml-2 text-emerald-400">· Drop to upload</span>
                )}
              </div>
              {hostDragOver && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-emerald-500/15 ring-2 ring-inset ring-emerald-400/50">
                  <p className="rounded-lg bg-black/50 px-4 py-2 text-sm font-medium text-emerald-200">
                    Drop files to upload here
                  </p>
                </div>
              )}
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
                      isDragging={dragPath === entry.path}
                      isDropTarget={dropTarget === entry.path && entry.isDirectory}
                      onClick={() => handleOpen(entry)}
                      onSelect={() => {
                        selectEntry(entry);
                        if (
                          !entry.isDirectory &&
                          !isImageFile(entry.name, entry.size) &&
                          !isPdfFile(entry.name, entry.size)
                        ) {
                          loadPreview(entry);
                        }
                      }}
                      onDragStart={() => setDragPath(entry.path)}
                      onDragEnd={() => {
                        setDragPath(null);
                        setDropTarget(null);
                      }}
                      onDragOver={() => {
                        if (!entry.isDirectory || !dragPath) return;
                        if (
                          dragPath === entry.path ||
                          entry.path.startsWith(`${dragPath}/`)
                        ) {
                          return;
                        }
                        setDropTarget(entry.path);
                      }}
                      onDragLeave={() => {
                        if (dropTarget === entry.path) setDropTarget(null);
                      }}
                      onDrop={() => {
                        if (entry.isDirectory) handleDropOnFolder(entry.path);
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
              {selected &&
              !selected.isDirectory &&
              isImageFile(selected.name, selected.size) ? (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="flex flex-1 items-center justify-center overflow-auto bg-black/30 p-2">
                    <img
                      src={getRawFileUrl(selected.path)}
                      alt={selected.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="border-t border-white/10 p-2">
                    <Btn variant="primary" onClick={handleOpenInImageViewer}>
                      <ImageIcon size={12} />
                      Open in Image Viewer
                    </Btn>
                  </div>
                </div>
              ) : selected &&
                !selected.isDirectory &&
                isPdfFile(selected.name, selected.size) ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileType size={40} className="text-red-400/80" />
                  <p className="text-xs text-slate-400">
                    PDF document · {formatSize(selected.size)}
                  </p>
                  <Btn variant="primary" onClick={handleOpenInPdfViewer}>
                    <FileType size={12} />
                    Open in PDF Viewer
                  </Btn>
                </div>
              ) : (
                <pre className="flex-1 overflow-auto p-3 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                  {selected?.isDirectory
                    ? `Folder: ${selected.path}\n\n${entries.length} items`
                    : preview ??
                      'Select a file to preview (text ≤ 2 MB, images/PDF open in viewer)'}
                </pre>
              )}
              {selected &&
                !selected.isDirectory &&
                isEditableTextFile(selected.name, selected.size) && (
                  <div className="border-t border-white/10 p-2">
                    <Btn variant="primary" onClick={handleOpenInEditor}>
                      <FileText size={12} />
                      Open in Text Editor
                    </Btn>
                  </div>
                )}
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

      <PromptDialog
        open={dialog?.kind === 'mkdir'}
        title="New Folder"
        label="Folder name"
        defaultValue="New Folder"
        submitLabel="Create"
        validate={validateFileName}
        onCancel={closeDialog}
        onSubmit={(name) => {
          closeDialog();
          void mkdir(name);
        }}
      />

      <PromptDialog
        open={dialog?.kind === 'rename'}
        title="Rename"
        label="New name"
        defaultValue={selected?.name ?? ''}
        submitLabel="Rename"
        validate={(name) => {
          if (selected && name === selected.name) return 'Name is unchanged';
          return validateFileName(name);
        }}
        onCancel={closeDialog}
        onSubmit={(name) => {
          closeDialog();
          void renameSelected(name);
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        title="Delete"
        message={`Delete “${dialog?.kind === 'delete' ? dialog.name : ''}”? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={closeDialog}
        onConfirm={() => {
          closeDialog();
          void removeSelected();
        }}
      />
    </AppShell>
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
  onRename,
  onDelete,
  onOpenInEditor,
  onOpenInImageViewer,
  onOpenInPdfViewer,
  canOpenInEditor,
  canOpenInImageViewer,
  canOpenInPdfViewer,
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
  onRename: () => void;
  onDelete: () => void;
  onOpenInEditor: () => void;
  onOpenInImageViewer: () => void;
  onOpenInPdfViewer: () => void;
  canOpenInEditor: boolean;
  canOpenInImageViewer: boolean;
  canOpenInPdfViewer: boolean;
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
      <ToolIcon icon={<Pencil size={16} />} title="Rename" disabled={!canCopy} onClick={onRename} />
      <ToolIcon icon={<Trash2 size={16} />} title="Delete" disabled={!canCopy} onClick={onDelete} />
      <ToolIcon
        icon={<FileText size={16} />}
        title="Open in Text Editor"
        disabled={!canOpenInEditor}
        onClick={onOpenInEditor}
      />
      <ToolIcon
        icon={<ImageIcon size={16} />}
        title="Open in Image Viewer"
        disabled={!canOpenInImageViewer}
        onClick={onOpenInImageViewer}
      />
      <ToolIcon
        icon={<FileType size={16} />}
        title="Open in PDF Viewer"
        disabled={!canOpenInPdfViewer}
        onClick={onOpenInPdfViewer}
      />
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

const DRAG_PATH_TYPE = 'application/x-webos-path';

function FileRow({
  entry,
  selected,
  isDragging,
  isDropTarget,
  onClick,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  entry: FileEntry;
  selected: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onClick: () => void;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_PATH_TYPE, entry.path);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!entry.isDirectory) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onClick}
        className={clsx(
          'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition',
          selected && 'bg-[var(--accent)]/20 ring-1 ring-[var(--accent)]/40',
          isDropTarget && 'bg-emerald-500/20 ring-1 ring-emerald-400/50',
          isDragging && 'opacity-40',
          !selected && !isDropTarget && 'hover:bg-white/5'
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
