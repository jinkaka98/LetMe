import {
  DEFAULT_WS_PORT,
  ClientMessage,
  ServerMessage,
  ElementSnapshot,
  LivePreviewResult,
} from 'letme-shared';
import { livePreviewManager } from './content/livePreview.js';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

export class WsClient {
  private ws: WebSocket | null = null;
  private port: number;
  private state: ConnectionState = 'disconnected';
  private reconnectTimer: any = null;
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private onActiveElementRequested?: () => ElementSnapshot | null;

  constructor(port: number = DEFAULT_WS_PORT) {
    this.port = port;
  }

  setPort(port: number) {
    this.port = port;
    this.reconnect();
  }

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(cb: (state: ConnectionState) => void) {
    this.stateListeners.add(cb);
    cb(this.state);
    return () => this.stateListeners.delete(cb);
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    for (const listener of this.stateListeners) {
      listener(newState);
    }
  }

  setOnActiveElementRequested(handler: () => ElementSnapshot | null) {
    this.onActiveElementRequested = handler;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setState('connecting');
    try {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

      this.ws.onopen = () => {
        this.setState('connected');
        console.log('[LetMe] Connected to MCP Bridge on port', this.port);

        // Register current tab
        this.send({
          type: 'REGISTER_TAB',
          payload: {
            url: window.location.href,
            title: document.title,
          },
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('[LetMe] Failed to parse bridge message:', err);
        }
      };

      this.ws.onclose = () => {
        this.setState('disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setState('disconnected');
      };
    } catch {
      this.setState('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  reconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connect();
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  sendElementCaptured(snapshot: ElementSnapshot) {
    this.send({
      type: 'ELEMENT_CAPTURED',
      payload: snapshot,
      timestamp: Date.now(),
    });
  }

  private handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'APPLY_CSS_PREVIEW': {
        const { id, selector, cssRules } = msg.payload;
        const res = livePreviewManager.applyPreview(selector, cssRules);
        const resultPayload: LivePreviewResult = {
          id,
          selector,
          success: res.success,
          message: res.message,
        };
        this.send({
          type: 'LIVE_PREVIEW_APPLIED',
          payload: resultPayload,
          timestamp: Date.now(),
        });
        break;
      }

      case 'CLEAR_CSS_PREVIEW': {
        livePreviewManager.clearPreview(msg.payload.selector);
        break;
      }

      case 'HIGHLIGHT_ELEMENT': {
        livePreviewManager.highlightElement(msg.payload.selector, msg.payload.durationMs);
        break;
      }

      case 'REQUEST_ACTIVE_ELEMENT': {
        if (this.onActiveElementRequested) {
          const snapshot = this.onActiveElementRequested();
          if (snapshot) {
            this.sendElementCaptured(snapshot);
          }
        }
        break;
      }
    }
  }
}

export const wsClient = new WsClient();
