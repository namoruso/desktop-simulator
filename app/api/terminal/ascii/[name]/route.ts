import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED = new Set(['rick', 'parrot', 'nyan', 'donut', 'forrest']);
const CONNECT_MS = 8_000;
const MAX_MS = 120_000;
const CURL_UA = 'curl/8.4.0 (WebOS Simulator)';

export async function GET(
  _req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = params.name?.toLowerCase();
  if (!name || !ALLOWED.has(name)) {
    return NextResponse.json({ error: 'Animation not found' }, { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const fail = (err: Error) => {
        if (closed) return;
        closed = true;
        controller.error(err);
      };

      const connectTimer = setTimeout(() => {
        req.destroy();
        fail(new Error('Connection to ascii.live timed out'));
      }, CONNECT_MS);

      const maxTimer = setTimeout(() => {
        req.destroy();
        close();
      }, MAX_MS);

      const req = https.get(
        {
          hostname: 'ascii.live',
          path: `/${name}`,
          headers: { 'User-Agent': CURL_UA, Accept: '*/*' },
        },
        (res) => {
          clearTimeout(connectTimer);
          if (res.statusCode && res.statusCode >= 400) {
            fail(new Error(`ascii.live returned HTTP ${res.statusCode}`));
            return;
          }
          res.on('data', (chunk: Buffer) => {
            if (!closed) controller.enqueue(new Uint8Array(chunk));
          });
          res.on('end', () => {
            clearTimeout(maxTimer);
            close();
          });
          res.on('error', (err) => {
            clearTimeout(maxTimer);
            fail(err);
          });
        }
      );

      req.on('error', (err) => {
        clearTimeout(connectTimer);
        clearTimeout(maxTimer);
        fail(err);
      });

      req.setTimeout(CONNECT_MS, () => {
        req.destroy();
        fail(new Error('Connection to ascii.live timed out'));
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Ascii-Animation': name,
    },
  });
}
