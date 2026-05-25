import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import si from 'systeminformation';
import type { StorageDrive, StorageSnapshot } from '@/types/storage.types';

const execAsync = promisify(exec);

interface LsblkDevice {
  name: string;
  size: number;
  type: string;
  rm?: boolean;
  mountpoint?: string | null;
  fstype?: string;
  label?: string;
  children?: LsblkDevice[];
}

function flattenLsblk(devices: LsblkDevice[]): LsblkDevice[] {
  const out: LsblkDevice[] = [];
  for (const d of devices) {
    if (d.mountpoint) out.push(d);
    if (d.children) out.push(...flattenLsblk(d.children));
  }
  return out;
}

function isUsbMount(mount: string, rm: boolean, label: string, name: string): boolean {
  if (rm) return true;
  const m = mount.toLowerCase();
  if (m.includes('/media/') || m.includes('/run/media/')) return true;
  if (m.startsWith('/mnt/usb') || m.startsWith('/mnt/')) return rm;
  if (/^sd[a-z][0-9]?$/i.test(name) && mount !== '/' && !mount.startsWith('/home')) {
    return rm;
  }
  return false;
}

function classifyDrive(
  mount: string,
  rm: boolean,
  isUsb: boolean
): StorageDrive['type'] {
  if (isUsb) return 'usb';
  if (mount === '/') return 'system';
  if (mount === os.homedir()) return 'home';
  if (mount === '/home') return 'disk';
  if (rm) return 'disk';
  return 'other';
}

async function getDiskUsage(mount: string): Promise<{
  totalGB: number;
  usedGB: number;
  freeGB: number;
}> {
  try {
    const { stdout } = await execAsync(
      `df -B1 --output=size,used,avail "${mount}" 2>/dev/null | tail -1`,
      { timeout: 3000 }
    );
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 3) {
      const total = parseInt(parts[0], 10) / 1e9;
      const used = parseInt(parts[1], 10) / 1e9;
      const free = parseInt(parts[2], 10) / 1e9;
      return {
        totalGB: Math.round(total * 10) / 10,
        usedGB: Math.round(used * 10) / 10,
        freeGB: Math.round(free * 10) / 10,
      };
    }
  } catch {
    /* ignore */
  }
  return { totalGB: 0, usedGB: 0, freeGB: 0 };
}

export async function collectStorage(): Promise<StorageSnapshot> {
  const mem = await si.mem();
  const physicalRamGB = Math.round((mem.total / 1e9) * 10) / 10;
  const swapTotalGB = Math.round((mem.swaptotal / 1e9) * 10) / 10;
  const swapUsedGB = Math.round((mem.swapused / 1e9) * 10) / 10;

  const drives: StorageDrive[] = [];
  const seenMounts = new Set<string>();

  const addDrive = async (opts: {
    mount: string;
    name: string;
    label: string;
    device: string;
    rm: boolean;
    fstype: string;
  }) => {
    if (!opts.mount || seenMounts.has(opts.mount)) return;
    try {
      await fs.access(opts.mount);
    } catch {
      return;
    }
    seenMounts.add(opts.mount);
    const usage = await getDiskUsage(opts.mount);
    const isUsb = isUsbMount(opts.mount, opts.rm, opts.label, opts.device);
    const usedPercent =
      usage.totalGB > 0
        ? Math.round((usage.usedGB / usage.totalGB) * 1000) / 10
        : 0;
    drives.push({
      id: opts.mount,
      name: opts.name,
      label: opts.label || opts.name,
      mount: opts.mount,
      type: classifyDrive(opts.mount, opts.rm, isUsb),
      ...usage,
      usedPercent,
      isRemovable: opts.rm,
      isUSB: isUsb,
      filesystem: opts.fstype || '—',
      device: opts.device,
    });
  };

  try {
    const { stdout } = await execAsync('lsblk -J -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,LABEL,RM 2>/dev/null', {
      timeout: 5000,
    });
    const json = JSON.parse(stdout);
    const mounted = flattenLsblk(json.blockdevices || []);
    for (const d of mounted) {
      if (!d.mountpoint) continue;
      await addDrive({
        mount: d.mountpoint,
        name: d.name,
        label: d.label || d.name,
        device: `/dev/${d.name}`,
        rm: !!d.rm,
        fstype: d.fstype || '',
      });
    }
  } catch {
    /* lsblk unavailable */
  }

  await addDrive({
    mount: '/',
    name: 'root',
    label: 'System (/)',
    device: 'rootfs',
    rm: false,
    fstype: 'rootfs',
  });

  const home = os.homedir();
  await addDrive({
    mount: home,
    name: 'Home',
    label: 'Home',
    device: 'home',
    rm: false,
    fstype: 'ext4',
  });

  for (const base of ['/media', `/run/media/${os.userInfo().username}`, '/mnt']) {
    try {
      const entries = await fs.readdir(base, { withFileTypes: true });
      for (const e of entries) {
        if (!e.isDirectory()) continue;
        const mount = path.join(base, e.name);
        await addDrive({
          mount,
          name: e.name,
          label: e.name,
          device: e.name,
          rm: true,
          fstype: 'auto',
        });
      }
    } catch {
      /* path missing */
    }
  }

  drives.sort((a, b) => {
    const order = { usb: 0, home: 1, system: 2, disk: 3, other: 4, network: 5 };
    return (order[a.type] ?? 9) - (order[b.type] ?? 9);
  });

  return { drives, physicalRamGB, swapTotalGB, swapUsedGB, userHome: os.homedir() };
}
