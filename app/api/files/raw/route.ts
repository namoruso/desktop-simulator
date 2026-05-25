import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resolveSafePath } from '@/lib/safePath';
import { isImageFile, isPdfFile, MAX_IMAGE_BYTES, MAX_PDF_BYTES } from '@/lib/fileTypes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
};

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get('path');
    if (!raw) {
      return NextResponse.json({ error: 'path required' }, { status: 400 });
    }

    const filePath = await resolveSafePath(raw);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);

    if (!isImageFile(name, stat.size) && !isPdfFile(name, stat.size)) {
      return NextResponse.json(
        { error: 'File type not supported for viewing' },
        { status: 400 }
      );
    }

    const maxSize = ext === '.pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (stat.size > maxSize) {
      return NextResponse.json({ error: 'File too large to view' }, { status: 400 });
    }

    const buf = await fs.readFile(filePath);
    const mime = MIME[ext] ?? 'application/octet-stream';

    return new NextResponse(buf, {
      headers: {
        'Content-Type': mime,
        'Content-Length': String(stat.size),
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cannot read file';
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
