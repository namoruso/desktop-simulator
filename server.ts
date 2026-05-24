import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { collectSystemData } from './lib/collectSystemData';
import type { WSMessage } from './types/system.types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          const pong: WSMessage = {
            type: 'pong',
            payload: null,
            timestamp: Date.now(),
          };
          ws.send(JSON.stringify(pong));
        }
      } catch {
        /* ignore */
      }
    });

    ws.on('close', () => clients.delete(ws));
    collectAndBroadcast([ws]);
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);
    if (pathname === '/api/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  setInterval(() => {
    if (clients.size > 0) {
      collectAndBroadcast([...clients]);
    }
  }, 1000);

  server.listen(port, '0.0.0.0', () => {
    console.log(`> WebOS Simulator running on http://localhost:${port}`);
    console.log(`> WebSocket: ws://localhost:${port}/api/ws`);
  });
});

async function collectAndBroadcast(targets: WebSocket[]) {
  try {
    const snapshot = await collectSystemData();
    const message: WSMessage = {
      type: 'system_snapshot',
      payload: snapshot,
      timestamp: Date.now(),
    };
    const data = JSON.stringify(message);
    targets.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  } catch (err) {
    console.error('[WS] Error collecting data:', err);
  }
}
