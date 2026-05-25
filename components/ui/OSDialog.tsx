'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Btn } from '@/components/ui/os-ui';

function DialogFrame({
  title,
  onCancel,
  children,
  footer,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="os-dialog-title"
        className="w-full max-w-sm rounded-xl border border-white/15 bg-[rgba(22,26,38,0.98)] shadow-2xl shadow-black/50"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 px-4 py-3">
          <h2 id="os-dialog-title" className="text-sm font-semibold text-slate-100">
            {title}
          </h2>
        </div>
        <div className="px-4 pb-4">{children}</div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function PromptDialog({
  open,
  title,
  label,
  defaultValue = '',
  placeholder,
  submitLabel = 'OK',
  onSubmit,
  onCancel,
  validate,
}: {
  open: boolean;
  title: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  validate?: (value: string) => string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      setError(null);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open, defaultValue]);

  if (!open) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        setError(err);
        return;
      }
    }
    onSubmit(trimmed);
  };

  return (
    <DialogFrame
      title={title}
      onCancel={onCancel}
      footer={
        <>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}>
            {submitLabel}
          </Btn>
        </>
      }
    >
      {label && (
        <label className="mb-2 block text-xs text-slate-400">{label}</label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        className={clsx(
          'w-full rounded-lg border bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none',
          error
            ? 'border-red-500/50 focus:border-red-400'
            : 'border-white/15 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40'
        )}
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </DialogFrame>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <DialogFrame
      title={title}
      onCancel={onCancel}
      footer={
        <>
          <Btn onClick={onCancel}>{cancelLabel}</Btn>
          <Btn
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-300">{message}</p>
    </DialogFrame>
  );
}

export function PasswordDialog({
  open,
  networkName,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  networkName: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (!password) return;
    onSubmit(password);
  };

  return (
    <DialogFrame
      title={`Connect to “${networkName}”`}
      onCancel={onCancel}
      footer={
        <>
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn variant="primary" onClick={submit}>
            Connect
          </Btn>
        </>
      }
    >
      <label className="mb-2 block text-xs text-slate-400">Network password</label>
      <input
        ref={inputRef}
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40"
        autoComplete="off"
      />
    </DialogFrame>
  );
}

export function RecentFilesDialog({
  open,
  files,
  onSelect,
  onClear,
  onCancel,
}: {
  open: boolean;
  files: string[];
  onSelect: (path: string) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <DialogFrame
      title="Recent Files"
      onCancel={onCancel}
      footer={
        <>
          {files.length > 0 && (
            <Btn onClick={onClear}>Clear list</Btn>
          )}
          <Btn onClick={onCancel}>Close</Btn>
        </>
      }
    >
      {files.length === 0 ? (
        <p className="text-sm text-slate-400">
          No recent files. Open a text file from File Manager.
        </p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-auto">
          {files.map((path) => {
            const name = path.split(/[/\\]/).pop() ?? path;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => onSelect(path)}
                  className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-white/10"
                >
                  <span className="block truncate text-sm text-slate-200">{name}</span>
                  <span className="block truncate font-mono text-[10px] text-slate-500">
                    {path}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DialogFrame>
  );
}
