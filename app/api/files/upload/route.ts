import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveSafePath } from '@/lib/safePath';
import { logFileIo } from '@/lib/logFileIo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_BYTES = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const destDirRaw = formData.get('destDir');
    const file = formData.get('file');

    if (typeof destDirRaw !== 'string' || !destDirRaw) {
      return NextResponse.json({ error: 'destDir required' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }

    const destDir = await resolveSafePath(destDirRaw);
    const stat = await fs.stat(destDir);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Destination is not a folder' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_BYTES / 1024 / 1024} MB)` },
        { status: 400 }
      );
    }

    const safeName = path.basename(file.name).replace(/[/\\]/g, '') || 'upload';
    const dest = path.join(destDir, safeName);

    try {
      await fs.access(dest);
      return NextResponse.json(
        { error: `“${safeName}” already exists in this folder` },
        { status: 409 }
      );
    } catch {
      /* destination free */
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(dest, bytes);
    logFileIo(`Upload ${safeName} → ${destDir}`, { bytes: file.size });

    return NextResponse.json({ ok: true, path: dest, name: safeName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
