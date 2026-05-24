import {
  Activity,
  Calculator,
  FileText,
  FolderOpen,
  Globe,
  Settings,
  Terminal,
  type LucideIcon,
} from 'lucide-react';
import type { AppType } from '@/types/window.types';

export const APP_ICONS: Record<AppType, LucideIcon> = {
  'task-manager': Activity,
  terminal: Terminal,
  'text-editor': FileText,
  calculator: Calculator,
  browser: Globe,
  'file-manager': FolderOpen,
  settings: Settings,
};

export const APP_LABELS: Record<AppType, string> = {
  'task-manager': 'Task Manager',
  terminal: 'Terminal',
  'text-editor': 'Text Editor',
  calculator: 'Calculator',
  browser: 'Browser',
  'file-manager': 'Files',
  settings: 'Settings',
};

export const DOCK_APPS: AppType[] = [
  'file-manager',
  'task-manager',
  'terminal',
  'text-editor',
  'calculator',
  'browser',
  'settings',
];

export const DESKTOP_APPS: AppType[] = [
  'file-manager',
  'task-manager',
  'terminal',
  'text-editor',
  'calculator',
  'browser',
  'settings',
];

export function AppIcon({
  appType,
  size = 24,
  className = '',
}: {
  appType: AppType;
  size?: number;
  className?: string;
}) {
  const Icon = APP_ICONS[appType];
  return <Icon size={size} className={className} strokeWidth={1.75} />;
}
