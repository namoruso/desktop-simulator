import { NextRequest, NextResponse } from 'next/server';
import { collectNetworks, connectToNetwork } from '@/lib/networkScan';
import { appendServerIoLog } from '@/lib/serverIoLog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await collectNetworks();
    appendServerIoLog({
      direction: 'in',
      source: 'network',
      summary: `Wi-Fi scan (${snapshot.networks.length} networks)`,
    });
    return NextResponse.json(snapshot);
  } catch (err) {
    console.error('[API] network scan:', err);
    return NextResponse.json(
      { error: 'Failed to scan networks' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ssid = body?.ssid as string;
    const password = body?.password as string | undefined;
    if (!ssid || typeof ssid !== 'string') {
      return NextResponse.json({ error: 'ssid required' }, { status: 400 });
    }
    const result = await connectToNetwork(ssid, password);
    appendServerIoLog({
      direction: 'out',
      source: 'network',
      summary: `Connect to “${ssid}” — ${result.ok ? 'ok' : result.message}`,
    });
    const snapshot = await collectNetworks();
    return NextResponse.json({ ...result, snapshot });
  } catch (err) {
    console.error('[API] network connect:', err);
    return NextResponse.json(
      { error: 'Failed to connect' },
      { status: 500 }
    );
  }
}
