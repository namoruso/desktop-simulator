export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
  inUse: boolean;
}

export interface NetworkSnapshot {
  interface: string;
  wifiEnabled: boolean;
  activeSsid: string | null;
  activeConnection: string | null;
  networks: WifiNetwork[];
  ethernetConnected: boolean;
  source: 'nmcli' | 'simulated';
}
