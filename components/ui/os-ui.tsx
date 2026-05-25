'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

/** macOS System Settings — grouped list container */
export function MacSettingsGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx('mac-settings-group', className)}>{children}</div>;
}

export function MacSettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="mac-settings-row">
      <div className="min-w-0">
        <div className="mac-settings-row-label">{label}</div>
        {hint && <p className="mac-settings-row-hint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** macOS-style switch (51×31) */
export function MacToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="mac-toggle"
    >
      <span className="mac-toggle-knob" />
    </button>
  );
}

export function MacSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx('mac-select', className)}
    >
      {children}
    </select>
  );
}

export function MacColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="mac-color-swatch" title="Choose accent color">
      <span
        className="mac-color-swatch-preview"
        style={{ backgroundColor: value }}
        aria-hidden
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function MacRange({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="range"
      className="mac-range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function MacButton({
  children,
  onClick,
  variant = 'default',
  disabled,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'mac-btn',
        variant === 'primary' && 'mac-btn-primary',
        variant === 'danger' && 'mac-btn-danger',
        variant === 'default' && 'mac-btn-default',
        disabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      {children}
    </button>
  );
}

export function MacPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[640px] space-y-5 pb-8">
      <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h1>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/* Legacy aliases — map to mac components */
export const Toggle = MacToggle;
export const SettingRow = MacSettingsRow;

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
      {children}
    </h3>
  );
}

export function ProgressBar({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={clsx(
        'h-1.5 overflow-hidden rounded-full bg-white/10',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'default',
  disabled,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'cta';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const macVariant =
    variant === 'primary' || variant === 'cta' ? 'primary' : variant === 'danger' ? 'danger' : 'default';
  return (
    <MacButton
      onClick={onClick}
      variant={macVariant}
      disabled={disabled}
      className={className}
      title={title}
    >
      {children}
    </MacButton>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('mac-settings-group p-4', className)}>{children}</div>
  );
}

export function MacInput({
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
  disabled,
  onKeyDown,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={clsx('mac-field', className)}
    />
  );
}

export function MacSearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={clsx('mac-search', className)}
    />
  );
}

export function MacIconButton({
  children,
  onClick,
  title,
  active,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  className?: string;
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
        className
      )}
    >
      {children}
    </button>
  );
}

export function MacListItem({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'mac-list-item',
        active && 'mac-list-item-active',
        className
      )}
    >
      {children}
    </button>
  );
}
