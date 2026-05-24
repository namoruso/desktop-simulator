import { get, set } from 'idb-keyval';
import type { FSNode, IOLogEntry } from '@/types/filesystem.types';
import { generateId } from '@/lib/uuid';

const FS_KEY = 'webos-filesystem';
const IO_KEY = 'webos-io-logs';

const DEFAULT_TREE: FSNode[] = [
  {
    id: 'root',
    name: '/',
    path: '/',
    type: 'directory',
    parentPath: '',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'home',
    name: 'home',
    path: '/home',
    type: 'directory',
    parentPath: '/',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'user',
    name: 'user',
    path: '/home/user',
    type: 'directory',
    parentPath: '/home',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'docs',
    name: 'Documents',
    path: '/home/user/Documents',
    type: 'directory',
    parentPath: '/home/user',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'dl',
    name: 'Downloads',
    path: '/home/user/Downloads',
    type: 'directory',
    parentPath: '/home/user',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'sys',
    name: 'System',
    path: '/home/user/System',
    type: 'directory',
    parentPath: '/home/user',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'logs',
    name: 'logs',
    path: '/home/user/System/logs',
    type: 'directory',
    parentPath: '/home/user/System',
    size: 0,
    modifiedAt: new Date().toISOString(),
  },
  {
    id: 'readme',
    name: 'welcome.txt',
    path: '/home/user/Documents/welcome.txt',
    type: 'file',
    parentPath: '/home/user/Documents',
    content:
      'Welcome to WebOS Simulator.\n\nUse File Manager to browse virtual files.\nTerminal commands read live process data.\nTask Manager shows real CPU/RAM from your machine.',
    size: 180,
    modifiedAt: new Date().toISOString(),
    mimeType: 'text/plain',
  },
];

export async function loadFilesystem(): Promise<FSNode[]> {
  const stored = await get<FSNode[]>(FS_KEY);
  return stored?.length ? stored : DEFAULT_TREE;
}

export async function saveFilesystem(nodes: FSNode[]): Promise<void> {
  await set(FS_KEY, nodes);
}

export async function loadIOLogs(): Promise<IOLogEntry[]> {
  return (await get<IOLogEntry[]>(IO_KEY)) ?? [];
}

export async function appendIOLog(
  entry: Omit<IOLogEntry, 'id' | 'timestamp'>
): Promise<IOLogEntry> {
  const logs = await loadIOLogs();
  const full: IOLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const next = [full, ...logs].slice(0, 500);
  await set(IO_KEY, next);
  return full;
}

export function getChildren(nodes: FSNode[], dirPath: string): FSNode[] {
  const norm = dirPath === '/' ? '/' : dirPath.replace(/\/$/, '');
  return nodes
    .filter((n) => n.parentPath === norm || (norm === '/' && n.parentPath === ''))
    .filter((n) => n.path !== norm)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function findNode(nodes: FSNode[], path: string): FSNode | undefined {
  return nodes.find((n) => n.path === path);
}

export async function writeFile(
  nodes: FSNode[],
  parentPath: string,
  name: string,
  content: string
): Promise<FSNode[]> {
  const path =
    parentPath === '/' ? `/${name}` : `${parentPath.replace(/\/$/, '')}/${name}`;
  const existing = findNode(nodes, path);
  const now = new Date().toISOString();
  let next: FSNode[];

  if (existing) {
    next = nodes.map((n) =>
      n.path === path
        ? { ...n, content, size: content.length, modifiedAt: now }
        : n
    );
  } else {
    next = [
      ...nodes,
      {
        id: generateId(),
        name,
        path,
        type: 'file' as const,
        parentPath: parentPath === '/' ? '' : parentPath,
        content,
        size: content.length,
        modifiedAt: now,
        mimeType: 'text/plain',
      },
    ];
  }

  await saveFilesystem(next);
  await appendIOLog({
    direction: 'in',
    source: 'file-manager',
    summary: `Write ${path}`,
    bytes: content.length,
  });
  return next;
}

export async function deleteNode(
  nodes: FSNode[],
  path: string
): Promise<FSNode[]> {
  const next = nodes.filter(
    (n) => n.path !== path && !n.path.startsWith(path + '/')
  );
  await saveFilesystem(next);
  await appendIOLog({
    direction: 'out',
    source: 'file-manager',
    summary: `Delete ${path}`,
  });
  return next;
}

export async function resetFilesystem(): Promise<FSNode[]> {
  await set(FS_KEY, DEFAULT_TREE);
  await set(IO_KEY, []);
  return DEFAULT_TREE;
}
