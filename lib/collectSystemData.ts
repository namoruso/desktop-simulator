import si from 'systeminformation';
import type { SystemSnapshot } from '@/types/system.types';
import { collectStorage } from '@/lib/collectStorage';

export async function collectSystemData(): Promise<SystemSnapshot> {
  const [cpuLoad, mem, procs, cpuData, storage] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.processes(),
    si.cpu(),
    collectStorage().catch(() => undefined),
  ]);

  const totalMB = Math.round(mem.total / 1024 / 1024);
  const availableMB = Math.round(
    ((mem.available ?? mem.free) as number) / 1024 / 1024
  );
  const freeMB = Math.round(mem.free / 1024 / 1024);
  const cachedMB = Math.round(
    ((mem.buffcache || mem.cached || 0) as number) / 1024 / 1024
  );
  const hostUsedMB = Math.max(0, totalMB - availableMB);
  const hostUsedPercent =
    totalMB > 0 ? Math.round((hostUsedMB / totalMB) * 1000) / 10 : 0;

  const processes = procs.list.slice(0, 150).map((p) => ({
    pid: p.pid,
    name: p.name,
    path: p.path || '',
    cpu: p.cpu,
    memMB: Math.round((p.memRss || 0) / 1024 / 1024),
    priority: p.priority ?? 0,
    threads: Math.max(1, Number((p as { threads?: number }).threads) || 1),
    startTime: new Date(p.started || Date.now()).toISOString(),
  }));

  const appsUsedMB = Math.min(
    totalMB,
    processes.reduce((sum, p) => sum + p.memMB, 0)
  );

  return {
    timestamp: Date.now(),
    cpu: {
      usage: cpuLoad.currentLoad,
      cores: cpuLoad.cpus.map((c) => c.load),
      model: `${cpuData.manufacturer} ${cpuData.brand}`.trim(),
      speed: cpuData.speed,
    },
    memory: {
      totalMB,
      physicalTotalMB: totalMB,
      appsUsedMB,
      availableMB,
      freeMB,
      activeMB: Math.round((mem.active || mem.used) / 1024 / 1024),
      inactiveMB: Math.round(
        (Math.max(0, mem.used - mem.active - (mem.buffers || 0) - mem.cached)) /
          1024 /
          1024
      ),
      buffersMB: Math.round((mem.buffers || 0) / 1024 / 1024),
      cachedMB,
      hostUsedMB,
      hostUsedPercent,
      swapTotalMB: Math.round(mem.swaptotal / 1024 / 1024),
      swapUsedMB: Math.round(mem.swapused / 1024 / 1024),
    },
    storage,
    processes,
  };
}
