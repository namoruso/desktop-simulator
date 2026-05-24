# WebOS Simulator

Academic desktop OS simulator built with Next.js 14. Reads **live** CPU, RAM, and process data from your machine via `systeminformation` (Node.js) and streams it to the browser over WebSocket every second. The scheduler (Round Robin, FIFO, Priority) runs client-side over mapped real processes.

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Important:** Use `npm run dev` (custom server with WebSocket). Do not use `next dev` alone — WebSockets are mounted in `server.ts`.

## Architecture

- **Backend:** `server.ts` — HTTP (Next.js) + WebSocket on `/api/ws`
- **State:** Zustand stores (`store/`)
- **Scheduler:** `lib/scheduler.ts` + `hooks/useScheduler.ts`
- **Memory map:** 100 blocks proportional to real RAM (`lib/memoryManager.ts`)

## Apps

| App | Description |
|-----|-------------|
| Task Manager | Processes, CPU graph, memory grid, scheduler controls |
| Terminal | `ps`, `kill`, `free`, `uptime`, `top`, `help` |
| Text Editor | Saves to IndexedDB |
| Calculator | Basic arithmetic |
| Browser | iframe with URL whitelist |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Custom server (WS + Next) |
| `npm run build` | Production Next.js build |
| `npm run start` | Production custom server |

## OS lifecycle

`off` → Power On → `booting` (4s) → `running` → Shutdown / Restart

Persisted via Zustand (`localStorage`): OS state, window positions. IndexedDB: terminal history, editor files, scheduler config.
