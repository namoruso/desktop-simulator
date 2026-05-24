export type FSNodeType = 'file' | 'directory';

export interface FSNode {
  id: string;
  name: string;
  path: string;
  type: FSNodeType;
  parentPath: string;
  content?: string;
  size: number;
  modifiedAt: string;
  mimeType?: string;
}

export interface IOLogEntry {
  id: string;
  timestamp: string;
  direction: 'in' | 'out';
  source: string;
  summary: string;
  bytes?: number;
}
