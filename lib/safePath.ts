import path from 'path';
import os from 'os';
import fs from 'fs/promises';

const USER = os.userInfo().username;

export function getAllowedRoots(): string[] {
  const home = os.homedir();
  return [
    '/',
    home,
    `/home/${USER}`,
    '/home',
    '/media',
    `/run/media/${USER}`,
    '/mnt',
  ].filter((r, i, arr) => arr.indexOf(r) === i);
}

function isPathUnderRoot(candidate: string, realRoot: string): boolean {
  if (candidate === realRoot) return true;
  const root = realRoot.endsWith(path.sep) ? realRoot.slice(0, -1) : realRoot;
  if (root === '' || root === '/') {
    return candidate.startsWith('/') && candidate.length > 0;
  }
  return candidate.startsWith(root + path.sep);
}

export async function resolveSafePath(inputPath: string): Promise<string> {
  const resolved = path.resolve(inputPath);
  const roots = getAllowedRoots();

  for (const root of roots) {
    try {
      const realRoot = await fs.realpath(root);
      let candidate: string;
      try {
        candidate = await fs.realpath(resolved);
      } catch {
        candidate = resolved;
      }
      if (isPathUnderRoot(candidate, realRoot)) {
        await fs.access(candidate);
        return candidate;
      }
    } catch {
      if (resolved === root || isPathUnderRoot(resolved, root)) {
        await fs.access(resolved).catch(() => {
          throw new Error('Path not accessible');
        });
        return resolved;
      }
    }
  }

  throw new Error('Access denied: path outside allowed volumes');
}

export function getUserHomeDir(): string {
  return os.homedir();
}
