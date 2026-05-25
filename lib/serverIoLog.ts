import { generateId } from '@/lib/uuid';

export interface ServerIOLogEntry {
  id: string;
  timestamp: string;
  direction: 'in' | 'out';
  source: string;
  summary: string;
  bytes?: number;
}

const MAX = 500;
const buffer: ServerIOLogEntry[] = [];

export function appendServerIoLog(
  entry: Omit<ServerIOLogEntry, 'id' | 'timestamp'>
): ServerIOLogEntry {
  const full: ServerIOLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  buffer.unshift(full);
  if (buffer.length > MAX) buffer.length = MAX;
  return full;
}

export function getServerIoLogs(limit = 200): ServerIOLogEntry[] {
  return buffer.slice(0, limit);
}

export function clearServerIoLogs(): void {
  buffer.length = 0;
}
