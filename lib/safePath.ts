import path from 'path';
import os from 'os';
import fs from 'fs/promises';

const USER = os.userInfo().username;

export function getAllowedRoots(): string[] {
  const home = os.homedir();
  return [
    home,
    `/home/${USER}`,
    '/media',
    `/run/media/${USER}`,
    '/mnt',
  ].filter((r, i, arr) => arr.indexOf(r) === i);
}

export async function resolveSafePath(inputPath: string): Promise<string> {
  const resolved = path.resolve(inputPath);
  const roots = getAllowedRoots();

  for (const root of roots) {
    try {
      const realRoot = await fs.realpath(root);
      if (resolved === realRoot || resolved.startsWith(realRoot + path.sep)) {
        await fs.access(resolved);
        return resolved;
      }
    } catch {
      if (resolved === root || resolved.startsWith(root + path.sep)) {
        await fs.access(resolved).catch(() => {
          throw new Error('Path not accessible');
        });
        return resolved;
      }
    }
  }

  throw new Error('Access denied: path outside allowed volumes');
}
