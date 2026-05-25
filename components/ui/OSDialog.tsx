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
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="os-dialog-title"
        className="os-glass-popover w-full max-w-sm overflow-hidden rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mac-dialog-header">
          <h2
            id="os-dialog-title"
            className="text-[13px] font-semibold text-[var(--text-primary)]"
          >
            {title}
          </h2>
        </div>
        <div className="px-4 pb-4 pt-3">{children}</div>
        <div className="mac-dialog-footer">{footer}</div>
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
        <label className="mb-2 block text-[11px] text-[var(--text-muted)]">
          {label}
        </label>
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
          'mac-field',
          error && 'ring-2 ring-red-500/40'
        )}
      />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
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
      <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
        {message}
      </p>
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
      <label className="mb-2 block text-[11px] text-[var(--text-muted)]">
        Network password
      </label>
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
        className="mac-field"
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
          {files.length > 0 && <Btn onClick={onClear}>Clear list</Btn>}
          <Btn onClick={onCancel}>Close</Btn>
        </>
      }
    >
      {files.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">
          No recent files. Open a text file from File Manager.
        </p>
      ) : (
        <ul className="max-h-56 space-y-0.5 overflow-auto">
          {files.map((path) => {
            const name = path.split(/[/\\]/).pop() ?? path;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => onSelect(path)}
                  className="mac-list-item flex-col items-start py-2"
                >
                  <span className="block truncate text-[13px]">{name}</span>
                  <span className="block truncate font-mono text-[10px] text-[var(--text-subtle)]">
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
