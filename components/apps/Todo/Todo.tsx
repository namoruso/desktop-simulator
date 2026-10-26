'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  CheckSquare,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  Square,
  Trash2,
} from 'lucide-react';
import { AppShell, AppToolbar, ToolbarButton } from '@/components/ui/AppShell';
import { MacIconButton, MacListItem, MacSelect } from '@/components/ui/os-ui';
import { ConfirmDialog, PromptDialog } from '@/components/ui/OSDialog';
import { useTodoStore } from '@/store/useTodoStore';
import { useWindowStore } from '@/store/useWindowStore';

type DialogState =
  | { kind: 'folder-create' }
  | { kind: 'folder-rename'; folderId: string; name: string }
  | { kind: 'folder-delete'; folderId: string; name: string }
  | { kind: 'task-delete'; taskId: string; title: string }
  | null;

export function Todo() {
  const folders = useTodoStore((s) => s.folders);
  const tasks = useTodoStore((s) => s.tasks);
  const activeFolderId = useTodoStore((s) => s.activeFolderId);
  const showCompleted = useTodoStore((s) => s.showCompleted);
  const ensureDefaults = useTodoStore((s) => s.ensureDefaults);
  const createFolder = useTodoStore((s) => s.createFolder);
  const updateFolder = useTodoStore((s) => s.updateFolder);
  const deleteFolder = useTodoStore((s) => s.deleteFolder);
  const setActiveFolder = useTodoStore((s) => s.setActiveFolder);
  const createTask = useTodoStore((s) => s.createTask);
  const updateTask = useTodoStore((s) => s.updateTask);
  const toggleTask = useTodoStore((s) => s.toggleTask);
  const deleteTask = useTodoStore((s) => s.deleteTask);
  const moveTask = useTodoStore((s) => s.moveTask);
  const setShowCompleted = useTodoStore((s) => s.setShowCompleted);
  const taskCount = useTodoStore((s) => s.taskCount);

  const [dialog, setDialog] = useState<DialogState>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const newTaskRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureDefaults();
  }, [ensureDefaults]);

  const sortedFolders = useMemo(
    () => [...folders].sort((a, b) => a.order - b.order),
    [folders]
  );

  const activeFolder = sortedFolders.find((f) => f.id === activeFolderId);

  const visibleTasks = useMemo(() => {
    if (!activeFolderId) return [];
    return tasks
      .filter((t) => t.folderId === activeFolderId)
      .filter((t) => showCompleted || !t.completed)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [tasks, activeFolderId, showCompleted]);

  useEffect(() => {
    const win = useWindowStore
      .getState()
      .windows.find((w) => w.appType === 'todo' && !w.isMinimized);
    if (!win) return;
    const label = activeFolder ? `Todo — ${activeFolder.name}` : 'Todo';
    useWindowStore.getState().setWindowTitle(win.id, label);
  }, [activeFolder]);

  const submitNewTask = () => {
    if (!activeFolderId || !newTaskTitle.trim()) return;
    createTask(activeFolderId, newTaskTitle);
    setNewTaskTitle('');
    newTaskRef.current?.focus();
  };

  const startEditTask = (taskId: string, title: string) => {
    setEditingTaskId(taskId);
    setEditingTitle(title);
  };

  const commitEditTask = () => {
    if (!editingTaskId) return;
    const trimmed = editingTitle.trim();
    if (trimmed) {
      updateTask(editingTaskId, { title: trimmed });
    }
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTitle('');
  };

  return (
    <AppShell>
      <AppToolbar>
        <ToolbarButton
          title="New folder"
          onClick={() => setDialog({ kind: 'folder-create' })}
        >
          <FolderPlus size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="New task"
          disabled={!activeFolderId}
          onClick={() => newTaskRef.current?.focus()}
        >
          <Plus size={16} />
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton
          title={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
          active={showCompleted}
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <CheckSquare size={16} />
        </ToolbarButton>
      </AppToolbar>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-52 shrink-0 flex-col border-r border-[var(--separator)] bg-[var(--app-bg-elevated)]">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Folders
          </div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-auto px-2 pb-2">
            {sortedFolders.map((folder) => {
              const count = taskCount(folder.id);
              const active = folder.id === activeFolderId;
              return (
                <li key={folder.id} className="group relative">
                  <MacListItem
                    active={active}
                    onClick={() => setActiveFolder(folder.id)}
                    className="w-full justify-between gap-2 pr-16"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Folder
                        size={15}
                        className={clsx(
                          'shrink-0',
                          active ? 'text-white' : 'text-[var(--accent)]'
                        )}
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    {count > 0 && (
                      <span
                        className={clsx(
                          'shrink-0 rounded-full px-1.5 text-[10px] font-medium',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-[var(--text-muted)]'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </MacListItem>
                  <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <MacIconButton
                      title="Rename folder"
                      className="!h-6 !w-6"
                      onClick={() => {
                        setDialog({
                          kind: 'folder-rename',
                          folderId: folder.id,
                          name: folder.name,
                        });
                      }}
                    >
                      <Pencil size={12} />
                    </MacIconButton>
                    <MacIconButton
                      title="Delete folder"
                      className="!h-6 !w-6"
                      disabled={folders.length <= 1}
                      onClick={() => {
                        setDialog({
                          kind: 'folder-delete',
                          folderId: folder.id,
                          name: folder.name,
                        });
                      }}
                    >
                      <Trash2 size={12} />
                    </MacIconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-[var(--separator)] px-4 py-3">
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              {activeFolder?.name ?? 'Select a folder'}
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {visibleTasks.length} task{visibleTasks.length === 1 ? '' : 's'}
              {!showCompleted && ' · completed hidden'}
            </p>
          </header>

          <div className="border-b border-[var(--separator)] px-4 py-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitNewTask();
              }}
            >
              <input
                ref={newTaskRef}
                type="text"
                value={newTaskTitle}
                placeholder="New task…"
                disabled={!activeFolderId}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="mac-field min-w-0 flex-1"
              />
              <button
                type="submit"
                disabled={!activeFolderId || !newTaskTitle.trim()}
                className="mac-btn mac-btn-primary px-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>

          <ul className="min-h-0 flex-1 overflow-auto px-2 py-2">
            {visibleTasks.length === 0 ? (
              <li className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-4 text-center text-[var(--text-muted)]">
                <Square size={28} strokeWidth={1.25} className="opacity-40" />
                <p className="text-[13px]">No tasks in this folder</p>
                <p className="text-[11px]">Add one above or create a new folder</p>
              </li>
            ) : (
              visibleTasks.map((task) => {
                const editing = editingTaskId === task.id;
                return (
                  <li
                    key={task.id}
                    className="group mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]"
                  >
                    <button
                      type="button"
                      title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                      onClick={() => toggleTask(task.id)}
                      className={clsx(
                        'mac-icon-btn shrink-0 !h-7 !w-7',
                        task.completed && 'text-[var(--mac-green)]'
                      )}
                    >
                      {task.completed ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>

                    {editing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        autoFocus
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitEditTask}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitEditTask();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditTask();
                          }
                        }}
                        className="mac-field min-w-0 flex-1 py-1 text-[13px]"
                      />
                    ) : (
                      <button
                        type="button"
                        onDoubleClick={() => startEditTask(task.id, task.title)}
                        className={clsx(
                          'min-w-0 flex-1 truncate text-left text-[13px]',
                          task.completed
                            ? 'text-[var(--text-muted)] line-through'
                            : 'text-[var(--text-primary)]'
                        )}
                      >
                        {task.title}
                      </button>
                    )}

                    {!editing && (
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                        <MacSelect
                          value={task.folderId}
                          onChange={(folderId) => moveTask(task.id, folderId)}
                          className="!min-w-[100px] !py-1 text-[11px]"
                        >
                          {sortedFolders.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </MacSelect>
                        <MacIconButton
                          title="Edit task"
                          className="!h-7 !w-7"
                          onClick={() => startEditTask(task.id, task.title)}
                        >
                          <Pencil size={13} />
                        </MacIconButton>
                        <MacIconButton
                          title="Delete task"
                          className="!h-7 !w-7"
                          onClick={() =>
                            setDialog({
                              kind: 'task-delete',
                              taskId: task.id,
                              title: task.title,
                            })
                          }
                        >
                          <Trash2 size={13} />
                        </MacIconButton>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </section>
      </div>

      <PromptDialog
        open={dialog?.kind === 'folder-create'}
        title="New folder"
        label="Folder name"
        placeholder="Work, Personal…"
        submitLabel="Create"
        onCancel={() => setDialog(null)}
        onSubmit={(name) => {
          createFolder(name);
          setDialog(null);
        }}
        validate={(name) => {
          if (sortedFolders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
            return 'A folder with this name already exists';
          }
          return null;
        }}
      />

      <PromptDialog
        open={dialog?.kind === 'folder-rename'}
        title="Rename folder"
        label="Folder name"
        defaultValue={dialog?.kind === 'folder-rename' ? dialog.name : ''}
        submitLabel="Save"
        onCancel={() => setDialog(null)}
        onSubmit={(name) => {
          if (dialog?.kind === 'folder-rename') {
            updateFolder(dialog.folderId, name);
          }
          setDialog(null);
        }}
        validate={(name) => {
          if (dialog?.kind !== 'folder-rename') return null;
          const duplicate = sortedFolders.some(
            (f) =>
              f.id !== dialog.folderId &&
              f.name.toLowerCase() === name.toLowerCase()
          );
          if (duplicate) return 'A folder with this name already exists';
          return null;
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'folder-delete'}
        title="Delete folder?"
        message={
          dialog?.kind === 'folder-delete'
            ? `Delete “${dialog.name}” and all tasks inside it? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          if (dialog?.kind === 'folder-delete') {
            deleteFolder(dialog.folderId);
          }
          setDialog(null);
        }}
      />

      <ConfirmDialog
        open={dialog?.kind === 'task-delete'}
        title="Delete task?"
        message={
          dialog?.kind === 'task-delete'
            ? `Delete “${dialog.title}”?`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          if (dialog?.kind === 'task-delete') {
            deleteTask(dialog.taskId);
          }
          setDialog(null);
        }}
      />
    </AppShell>
  );
}
