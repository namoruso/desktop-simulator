import { appendServerIoLog } from '@/lib/serverIoLog';

export function logFileIo(
  summary: string,
  opts?: { bytes?: number; direction?: 'in' | 'out' }
) {
  appendServerIoLog({
    direction: opts?.direction ?? 'out',
    source: 'filesystem',
    summary,
    bytes: opts?.bytes,
  });
}
