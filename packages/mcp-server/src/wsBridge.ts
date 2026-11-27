import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import {
  DEFAULT_WS_PORT,
  ClientMessage,
  ServerMessage,
  LivePreviewRequest,
  LivePreviewResult,
} from '@letme/shared';
import { globalStore } from './stateStore.js';

export class WsBridge {
  private httpServer: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number = DEFAULT_WS_PORT) {
    this.port = port;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.httpServer = http.createServer((req, res) => {
          const url = req.url || '/';
          if (req.method === 'GET' && (url === '/' || url === '/health')) {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(
              JSON.stringify({
                status: 'ok',
                service: 'letme-mcp-bridge',
                port: this.port,
                connectedClients: this.clients.size,
              }),
            );
            return;
          }
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        });

        this.wss = new WebSocketServer({ noServer: true });

        this.httpServer.on('upgrade', (request, socket, head) => {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit('connection', ws, request);
          });
        });

        this.httpServer.on('error', (err) => {
          console.error('[LetMe WS Bridge] Server error:', err);
          reject(err);
        });

        this.wss.on('connection', (ws: WebSocket, req) => {
          const clientKey = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
          this.clients.add(ws);
          console.error(`[LetMe WS Bridge] Chrome client connected: ${clientKey}`);

          ws.on('message', (data: string | Buffer) => {
            try {
              const msg: ClientMessage = JSON.parse(data.toString());
              this.handleClientMessage(clientKey, msg, ws);
            } catch (err: any) {
              console.error('[LetMe WS Bridge] Error parsing message:', err.message);
            }
          });

          ws.on('close', () => {
            this.clients.delete(ws);
            globalStore.unregisterTab(clientKey);
            console.error(`[LetMe WS Bridge] Chrome client disconnected: ${clientKey}`);
          });

          ws.on('error', (err) => {
            console.error(`[LetMe WS Bridge] WebSocket client error:`, err);
          });
        });

        this.httpServer.listen(this.port, '127.0.0.1', () => {
          // Log to stderr because MCP communication uses stdout!
          console.error(`[LetMe WS Bridge] Listening on http://127.0.0.1:${this.port} (HTTP + WS)`);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleClientMessage(clientKey: string, msg: ClientMessage, ws: WebSocket) {
    switch (msg.type) {
      case 'REGISTER_TAB':
        globalStore.registerTab(clientKey, {
          id: clientKey,
          url: msg.payload.url,
          title: msg.payload.title,
          connectedAt: Date.now(),
        });
        console.error(`[LetMe WS Bridge] Tab registered: ${msg.payload.title} (${msg.payload.url})`);
        break;

      case 'ELEMENT_CAPTURED':
        globalStore.setActiveElement(msg.payload);
        console.error(
          `[LetMe WS Bridge] Element captured from page: <${msg.payload.tagName}> ${msg.payload.selector}`
        );
        this.broadcastSnapshotsList();
        break;

      case 'LIST_SNAPSHOTS':
        this.sendToClient(ws, {
          type: 'SNAPSHOTS_LIST',
          payload: { snapshots: this.getSnapshotSummaries() },
          timestamp: Date.now(),
        });
        break;

      case 'DELETE_SNAPSHOT':
        globalStore.deleteSnapshot(msg.payload.id);
        this.broadcastSnapshotsList();
        break;

      case 'LIVE_PREVIEW_APPLIED':
        globalStore.resolvePendingPreview(msg.payload);
        console.error(
          `[LetMe WS Bridge] Live preview applied on browser: ${msg.payload.selector} (Success: ${msg.payload.success})`
        );
        break;

      case 'CONSOLE_LOGS':
        globalStore.addConsoleLogs(msg.payload.logs);
        break;

      case 'PING':
        this.sendToClient(ws, {
          type: 'PONG',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
        break;
    }
  }

  broadcast(message: ServerMessage) {
    const raw = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    }
  }

  private getSnapshotSummaries() {
    return globalStore.getSnapshots().map((s) => ({
      id: s.id,
      timestamp: s.timestamp,
      tagName: s.tagName,
      selector: s.selector,
      url: s.url,
      userInstructions: s.userInstructions,
      userBugNotes: s.userBugNotes,
    }));
  }

  private broadcastSnapshotsList() {
    this.broadcast({
      type: 'SNAPSHOTS_LIST',
      payload: { snapshots: this.getSnapshotSummaries() },
      timestamp: Date.now(),
    });
  }

  private sendToClient(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  async applyCssPreview(selector: string, cssRules: Record<string, string>): Promise<LivePreviewResult> {
    if (this.clients.size === 0) {
      throw new Error('No active Chrome tabs connected to LetMe extension.');
    }

    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const request: LivePreviewRequest = {
      id: previewId,
      selector,
      cssRules,
    };

    const promise = new Promise<LivePreviewResult>((resolve, reject) => {
      globalStore.registerPendingPreview(previewId, resolve, reject, 5000);
    });

    this.broadcast({
      type: 'APPLY_CSS_PREVIEW',
      payload: request,
      timestamp: Date.now(),
    });

    return promise;
  }

  clearCssPreview(selector?: string) {
    if (this.clients.size === 0) {
      return;
    }
    this.broadcast({
      type: 'CLEAR_CSS_PREVIEW',
      payload: { selector },
      timestamp: Date.now(),
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = null;
    }
  }
}

const rawPort = process.env.LETME_WS_PORT || process.env.LETME_PORT;
export const wsBridge = new WsBridge(
  rawPort ? parseInt(rawPort, 10) : DEFAULT_WS_PORT
);
