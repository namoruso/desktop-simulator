import { NextRequest, NextResponse } from 'next/server';
import { collectNetworks, connectToNetwork } from '@/lib/networkScan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const snapshot = await collectNetworks();
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
    if (!ssid || typeof ssid !== 'string') {
      return NextResponse.json({ error: 'ssid required' }, { status: 400 });
    }
    const result = await connectToNetwork(ssid);
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
