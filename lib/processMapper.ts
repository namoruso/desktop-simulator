import type { OSProcess } from '@/types/process.types';
import type { RawProcess } from '@/types/system.types';

const SYSTEM_PROCESS_NAMES = new Set([
  'kernel',
  'systemd',
  'launchd',
  'WindowServer',
  'kswapd0',
  'kthreadd',
  'init',
  'dbus-daemon',
  'sshd',
  'cron',
]);

export function isSystemProcess(name: string, path: string): boolean {
  const lower = name.toLowerCase();
  if (SYSTEM_PROCESS_NAMES.has(name)) return true;
  if (lower.startsWith('kworker') || lower.startsWith('migration')) return true;
  if (path.includes('/sbin/') || path.includes('/usr/libexec/')) return true;
  return false;
}

export function mapRawToOSProcess(
  raw: RawProcess,
  existing?: OSProcess,
  schedulerPid?: number | null
): OSProcess {
  const system = isSystemProcess(raw.name, raw.path);
  let state = existing?.state ?? 'ready';

  if (existing?.state === 'terminated') {
    state = 'terminated';
  } else if (schedulerPid === raw.pid) {
    state = 'running';
  } else if (existing?.state === 'suspended') {
    state = 'suspended';
  } else if (existing?.state === 'blocked') {
    state = 'blocked';
  } else if (existing?.state === 'running' && schedulerPid !== raw.pid) {
    state = 'ready';
  } else if (!existing) {
    state = 'new';
  }

  return {
    pid: raw.pid,
    name: raw.name,
    path: raw.path,
    state,
    priority: raw.priority ?? 0,
    cpuUsage: raw.cpu,
    memoryMB: raw.memMB,
    memoryBlocks: existing?.memoryBlocks ?? [],
    isSystemProcess: system,
    canBeKilled: !system,
    startTime:
      raw.startTime instanceof Date
        ? raw.startTime
        : new Date(raw.startTime as string | number),
    quantum: existing?.quantum ?? 100,
    ioWaitMs: existing?.ioWaitMs ?? 0,
    threads: raw.threads,
  };
}

export function rawProcessesToMap(
  raws: RawProcess[],
  existing: Map<number, OSProcess>,
  currentPid: number | null
): Map<number, OSProcess> {
  const next = new Map<number, OSProcess>();
  for (const raw of raws) {
    const prev = existing.get(raw.pid);
    next.set(raw.pid, mapRawToOSProcess(raw, prev, currentPid));
  }
  return next;
}
