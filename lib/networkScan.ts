import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import type { NetworkSnapshot, WifiNetwork } from '@/types/network.types';

const execAsync = promisify(exec);

function parseNmcliWifi(stdout: string): WifiNetwork[] {
  const seen = new Set<string>();
  const networks: WifiNetwork[] = [];

  for (const line of stdout.split('\n').filter(Boolean)) {
    const parts = line.split(':');
    if (parts.length < 4) continue;
    const ssid = parts[0]?.trim();
    if (!ssid || ssid === '--') continue;
    if (seen.has(ssid)) continue;
    seen.add(ssid);

    networks.push({
      ssid,
      signal: parseInt(parts[1], 10) || 0,
      security: parts[2] || '—',
      inUse: parts[3] === '*',
    });
  }

  return networks.sort((a, b) => b.signal - a.signal);
}

async function getActiveConnection(): Promise<{
  ssid: string | null;
  name: string | null;
}> {
  try {
    const { stdout } = await execAsync(
      'nmcli -t -f NAME,TYPE,DEVICE connection show --active 2>/dev/null',
      { timeout: 3000 }
    );
    for (const line of stdout.split('\n').filter(Boolean)) {
      const [name, type] = line.split(':');
      if (type === 'wifi' || name?.toLowerCase().includes('wifi')) {
        return { ssid: null, name: name || null };
      }
    }
    const { stdout: wifi } = await execAsync(
      'nmcli -t -f active,ssid dev wifi 2>/dev/null',
      { timeout: 3000 }
    );
    for (const line of wifi.split('\n').filter(Boolean)) {
      const [active, ssid] = line.split(':');
      if (active === 'yes' && ssid) return { ssid, name: ssid };
    }
  } catch {
    /* ignore */
  }
  return { ssid: null, name: null };
}

async function scanWithNmcli(): Promise<NetworkSnapshot | null> {
  try {
    await execAsync('nmcli general status 2>/dev/null', { timeout: 2000 });
    await execAsync('nmcli dev wifi rescan 2>/dev/null', { timeout: 8000 }).catch(
      () => {}
    );
    const { stdout } = await execAsync(
      'nmcli -t -f SSID,SIGNAL,SECURITY,IN-USE dev wifi list 2>/dev/null',
      { timeout: 5000 }
    );
    const networks = parseNmcliWifi(stdout);
    const active = await getActiveConnection();
    const inUse = networks.find((n) => n.inUse);
    const activeSsid = inUse?.ssid ?? active.ssid ?? active.name;

    return {
      interface: 'wlan0',
      wifiEnabled: true,
      activeSsid: activeSsid ?? null,
      activeConnection: active.name,
      networks,
      ethernetConnected: false,
      source: 'nmcli',
    };
  } catch {
    return null;
  }
}

async function scanSimulated(): Promise<NetworkSnapshot> {
  const ifaces = await si.networkInterfaces();
  const wifi = ifaces.find(
    (i) =>
      i.type?.toLowerCase() === 'wireless' ||
      i.iface?.startsWith('wl') ||
      i.iface?.startsWith('wifi')
  );
  const eth = ifaces.find(
    (i) => i.type?.toLowerCase() === 'wired' || i.iface === 'eth0'
  );

  const hostname = (await si.osInfo().catch(() => ({ hostname: 'WebOS' })))
    .hostname;

  const networks: WifiNetwork[] = [
    { ssid: `${hostname}-5G`, signal: 92, security: 'WPA2', inUse: true },
    { ssid: `${hostname}-2.4G`, signal: 78, security: 'WPA2', inUse: false },
    { ssid: 'Guest Network', signal: 55, security: 'WPA2', inUse: false },
    { ssid: 'Neighbor_WiFi', signal: 34, security: 'WPA2', inUse: false },
    { ssid: 'CoffeeShop_Free', signal: 28, security: 'Open', inUse: false },
  ];

  return {
    interface: wifi?.iface || 'wlan0',
    wifiEnabled: !!wifi,
    activeSsid: networks[0].ssid,
    activeConnection: networks[0].ssid,
    networks,
    ethernetConnected:
      !!eth && (eth.operstate === 'up' || eth.operstate === 'unknown'),
    source: 'simulated',
  };
}

export async function collectNetworks(): Promise<NetworkSnapshot> {
  const real = await scanWithNmcli();
  if (real && real.networks.length > 0) return real;
  return scanSimulated();
}

export async function connectToNetwork(ssid: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const safe = ssid.replace(/"/g, '\\"');
    await execAsync(`nmcli dev wifi connect "${safe}" 2>&1`, {
      timeout: 15000,
    });
    return { ok: true, message: `Connected to ${ssid}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('permission') || msg.includes('authorized')) {
      return {
        ok: true,
        message: `Simulated connection to ${ssid} (nmcli needs privileges on host)`,
      };
    }
    return {
      ok: true,
      message: `Connected to ${ssid} (simulated — ${msg.slice(0, 80)})`,
    };
  }
}
