import { NextRequest, NextResponse } from 'next/server';
import {
  getServerIoLogs,
  clearServerIoLogs,
  appendServerIoLog,
} from '@/lib/serverIoLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '200', 10);
  return NextResponse.json({ logs: getServerIoLogs(limit) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'clear') {
      clearServerIoLogs();
      return NextResponse.json({ ok: true });
    }
    if (body.direction && body.source && body.summary) {
      const entry = appendServerIoLog({
        direction: body.direction,
        source: body.source,
        summary: body.summary,
        bytes: body.bytes,
      });
      return NextResponse.json({ ok: true, entry });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  clearServerIoLogs();
  return NextResponse.json({ ok: true });
}
