'use client';

import clsx from 'clsx';
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

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
  stacked,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={clsx(
        'mac-settings-row',
        stacked && 'mac-settings-row-stacked'
      )}
    >
      <div className="min-w-0">
        <div className="mac-settings-row-label">{label}</div>
        {hint && <p className="mac-settings-row-hint">{hint}</p>}
      </div>
      <div className={clsx(stacked ? 'w-full' : 'shrink-0')}>{children}</div>
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
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number }>();
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const options = parseSelectOptions(children);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) {
        const menu = document.getElementById(listId);
        if (menu?.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, listId]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const el = btnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setMenuStyle({
        top: r.bottom + 4,
        left: r.right - Math.max(r.width, 160),
        width: Math.max(r.width, 160),
      });
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={clsx('mac-select flex items-center justify-between gap-2 text-left', className)}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={clsx('shrink-0 text-[var(--text-muted)] transition', open && 'rotate-180')}
        />
      </button>
      {open &&
        menuStyle &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            id={listId}
            role="listbox"
            className="mac-select-menu"
            style={{
              position: 'fixed',
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: 10000,
            }}
          >
            {options.map((opt) => (
              <li key={opt.value} role="option" aria-selected={opt.value === value}>
                <button
                  type="button"
                  className={clsx(
                    'mac-select-option',
                    opt.value === value && 'mac-select-option-active'
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}

const ACCENT_PRESETS = [
  '#0a84ff',
  '#34c759',
  '#ff9500',
  '#ff3b30',
  '#bf5af2',
  '#64d2ff',
  '#ffd60a',
];

function normalizeHex(raw: string): string {
  const s = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`;
  return '#0a84ff';
}

export function MacColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const color = normalizeHex(value);
  const [hexDraft, setHexDraft] = useState(color);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHexDraft(color);
  }, [color]);

  const commitHex = (raw: string) => {
    const next = normalizeHex(raw);
    if (/^#[0-9a-f]{6}$/i.test(next)) {
      onChange(next);
      setHexDraft(next);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center gap-1.5">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            title={preset}
            aria-label={`Accent ${preset}`}
            onClick={() => onChange(preset)}
            className={clsx(
              'mac-color-preset',
              color === preset && 'mac-color-preset-active'
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="mac-color-swatch"
          title="Open color picker"
          onClick={() => inputRef.current?.click()}
        >
          <span
            className="mac-color-swatch-preview"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        </button>
        <input
          ref={inputRef}
          type="color"
          value={color}
          className="sr-only"
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          value={hexDraft}
          spellCheck={false}
          maxLength={7}
          aria-label="Accent hex color"
          className="mac-field w-[5.5rem] px-2 py-1.5 font-mono text-[12px] uppercase"
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={() => commitHex(hexDraft)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitHex(hexDraft);
            }
          }}
        />
      </div>
    </div>
  );
}

function parseSelectOptions(children: ReactNode): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<{ value?: string; children?: ReactNode }>(child)) {
      options.push({
        value: String(child.props.value ?? ''),
        label: String(child.props.children ?? child.props.value ?? ''),
      });
    }
  });
  return options;
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
