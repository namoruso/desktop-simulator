export type DriveType = 'system' | 'home' | 'usb' | 'disk' | 'network' | 'other';

export interface StorageDrive {
  id: string;
  name: string;
  label: string;
  mount: string | null;
  type: DriveType;
  totalGB: number;
  usedGB: number;
  freeGB: number;
  usedPercent: number;
  isRemovable: boolean;
  isUSB: boolean;
  filesystem: string;
  device: string;
}

export interface StorageSnapshot {
  drives: StorageDrive[];
  physicalRamGB: number;
  swapTotalGB: number;
  swapUsedGB: number;
  /** Absolute path to the logged-in user's home directory */
  userHome: string;
}

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export interface ListDirResponse {
  path: string;
  parent: string | null;
  entries: FileEntry[];
  drive?: StorageDrive;
}
