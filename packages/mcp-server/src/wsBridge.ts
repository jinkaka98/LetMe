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
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number = DEFAULT_WS_PORT) {
    this.port = port;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port, host: '127.0.0.1' });

        this.wss.on('listening', () => {
          // Log to stderr because MCP communication uses stdout!
          console.error(`[LetMe WS Bridge] Listening on ws://127.0.0.1:${this.port}`);
          resolve();
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

        this.wss.on('error', (err) => {
          console.error('[LetMe WS Bridge] Server error:', err);
          reject(err);
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
  }
}

export const wsBridge = new WsBridge(
  process.env.LETME_PORT ? parseInt(process.env.LETME_PORT, 10) : DEFAULT_WS_PORT
);
