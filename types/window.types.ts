export type AppType =
  | 'task-manager'
  | 'terminal'
  | 'text-editor'
  | 'calculator'
  | 'browser'
  | 'file-manager'
  | 'image-viewer'
  | 'pdf-viewer'
  | 'settings';

export interface WindowInstance {
  id: string;
  appType: AppType;
  title: string;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  pid: number;
}
