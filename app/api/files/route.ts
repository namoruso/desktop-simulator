import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveSafePath } from '@/lib/safePath';
import { logFileIo } from '@/lib/logFileIo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('path');
    if (!raw) {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }
    const dirPath = await resolveSafePath(raw);
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Not a directory' }, { status: 400 });
    }

    const names = await fs.readdir(dirPath);
    const entries = await Promise.all(
      names.map(async (name) => {
        const full = path.join(dirPath, name);
        try {
          const s = await fs.stat(full);
          return {
            name,
            path: full,
            isDirectory: s.isDirectory(),
            size: s.size,
            modified: s.mtime.toISOString(),
          };
        } catch {
          return null;
        }
      })
    );

    const parent =
      path.dirname(dirPath) !== dirPath ? path.dirname(dirPath) : null;

    logFileIo(`List ${dirPath}`, { direction: 'in' });

    return NextResponse.json({
      path: dirPath,
      parent,
      entries: entries
        .filter(Boolean)
        .sort((a, b) => {
          if (a!.isDirectory !== b!.isDirectory) {
            return a!.isDirectory ? -1 : 1;
          }
          return a!.name.localeCompare(b!.name);
        }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'List failed';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === 'move') {
      const from = await resolveSafePath(body.from as string);
      const toDir = await resolveSafePath(body.toDir as string);
      const baseName = path.basename(from);
      const dest = path.join(toDir, baseName);
      if (path.dirname(from) === toDir) {
        return NextResponse.json({ ok: true, dest, skipped: true });
      }
      try {
        await fs.access(dest);
        return NextResponse.json(
          { error: `“${baseName}” already exists in destination` },
          { status: 409 }
        );
      } catch {
        /* destination free */
      }
      await fs.rename(from, dest);
      logFileIo(`Move ${from} → ${dest}`);
      return NextResponse.json({ ok: true, dest });
    }

    if (action === 'copy') {
      const from = await resolveSafePath(body.from as string);
      const toDir = await resolveSafePath(body.toDir as string);
      const baseName = path.basename(from);
      const dest = path.join(toDir, baseName);
      try {
        await fs.access(dest);
        return NextResponse.json(
          { error: `“${baseName}” already exists in destination` },
          { status: 409 }
        );
      } catch {
        /* destination free */
      }
      await fs.cp(from, dest, { recursive: true, errorOnExist: true });
      logFileIo(`Copy ${from} → ${dest}`);
      return NextResponse.json({ ok: true, dest });
    }

    if (action === 'delete') {
      const target = await resolveSafePath(body.path as string);
      const stat = await fs.stat(target);
      if (stat.isDirectory()) {
        await fs.rm(target, { recursive: true, force: true });
      } else {
        await fs.unlink(target);
      }
      logFileIo(`Delete ${target}`);
      return NextResponse.json({ ok: true });
    }

    if (action === 'rename') {
      const target = await resolveSafePath(body.path as string);
      const dir = path.dirname(target);
      const newName = (body.newName as string).replace(/[/\\]/g, '');
      const dest = path.join(dir, newName);
      await fs.rename(target, dest);
      logFileIo(`Rename ${target} → ${dest}`);
      return NextResponse.json({ ok: true, path: dest });
    }

    if (action === 'mkdir') {
      const dir = await resolveSafePath(body.path as string);
      const name = (body.name as string).replace(/[/\\]/g, '');
      const full = path.join(dir, name);
      await fs.mkdir(full, { recursive: Boolean(body.recursive) });
      logFileIo(`Mkdir ${full}`);
      return NextResponse.json({ ok: true, path: full });
    }

    if (action === 'mkdirp') {
      const full = await resolveSafePath(body.path as string);
      await fs.mkdir(full, { recursive: true });
      logFileIo(`Mkdir -p ${full}`);
      return NextResponse.json({ ok: true, path: full });
    }

    if (action === 'touch') {
      const filePath = await resolveSafePath(body.path as string);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, '', 'utf-8');
      }
      logFileIo(`Touch ${filePath}`);
      return NextResponse.json({ ok: true, path: filePath });
    }

    if (action === 'read') {
      const filePath = await resolveSafePath(body.path as string);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        return NextResponse.json({ error: 'Not a file' }, { status: 400 });
      }
      if (stat.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large to preview (max 2MB)' },
          { status: 400 }
        );
      }
      const content = await fs.readFile(filePath, 'utf-8');
      logFileIo(`Read ${filePath}`, { direction: 'in', bytes: stat.size });
      return NextResponse.json({ path: filePath, content, size: stat.size });
    }

    if (action === 'write') {
      const filePath = await resolveSafePath(body.path as string);
      const content = body.content;
      if (typeof content !== 'string') {
        return NextResponse.json({ error: 'content required' }, { status: 400 });
      }
      if (content.length > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File too large (max 2MB)' },
          { status: 400 }
        );
      }
      await fs.writeFile(filePath, content, 'utf-8');
      logFileIo(`Write ${filePath}`, { bytes: Buffer.byteLength(content, 'utf-8') });
      return NextResponse.json({ ok: true, path: filePath });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Operation failed';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
