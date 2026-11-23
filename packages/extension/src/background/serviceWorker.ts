import {
  DEFAULT_WS_PORT,
  ClientMessage,
  ServerMessage,
  LivePreviewResult,
} from '@letme/shared';

class ExtensionBridgeService {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private pendingMessages: ClientMessage[] = [];
  private port: number = DEFAULT_WS_PORT;

  constructor() {
    this.connect();
  }

  getIsConnected(): boolean {
    return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  async ensureConnected(timeoutMs: number = 800): Promise<boolean> {
    if (this.getIsConnected()) {
      return true;
    }

    // Trigger connection if not already connecting
    if (!this.ws || this.ws.readyState >= WebSocket.CLOSING) {
      this.connect();
    }

    return new Promise((resolve) => {
      if (this.getIsConnected()) {
        resolve(true);
        return;
      }

      const timer = setTimeout(() => {
        resolve(this.getIsConnected());
      }, timeoutMs);

      const poll = setInterval(() => {
        if (this.getIsConnected()) {
          clearInterval(poll);
          clearTimeout(timer);
          resolve(true);
        } else if (!this.ws || this.ws.readyState >= WebSocket.CLOSING) {
          clearInterval(poll);
          clearTimeout(timer);
          resolve(false);
        }
      }, 40);
    });
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

      this.ws.onopen = async () => {
        this.isConnected = true;
        console.log('[LetMe Background] Connected to MCP Bridge on ws://127.0.0.1:' + this.port);
        this.startHeartbeat();
        this.broadcastStatus(true);

        // Flush any queued messages that were held while connecting
        while (this.pendingMessages.length > 0) {
          const queued = this.pendingMessages.shift();
          if (queued) {
            this.send(queued);
          }
        }

        // Register active tab if available
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url) {
          this.send({
            type: 'REGISTER_TAB',
            payload: {
              url: activeTab.url,
              title: activeTab.title || 'Active Tab',
            },
            timestamp: Date.now(),
          });
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          await this.handleServerMessage(msg);
        } catch (err) {
          console.error('[LetMe Background] Failed to parse bridge message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.broadcastStatus(false);
        console.log('[LetMe Background] Bridge connection closed. Reconnecting in 1s...');
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        this.isConnected = false;
        this.broadcastStatus(false);
        console.warn('[LetMe Background] Bridge connection error:', err);
      };
    } catch {
      this.isConnected = false;
      this.broadcastStatus(false);
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'PING',
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, 15000); // 15s keepalive keeps socket open and resets MV3 idle timer
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private broadcastStatus(connected: boolean) {
    chrome.runtime.sendMessage({
      type: 'MCP_STATUS_CHANGED',
      connected,
    }).catch(() => {});

    chrome.tabs.query({}).then((tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'MCP_STATUS_CHANGED',
            connected,
          }).catch(() => {});
        }
      });
    }).catch(() => {});
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 1000);
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message so it is transmitted as soon as the socket connects
      this.pendingMessages.push(message);
      if (this.pendingMessages.length > 50) {
        this.pendingMessages.shift();
      }
      this.connect();
    }
  }

  private async handleServerMessage(msg: ServerMessage) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id) return;

    switch (msg.type) {
      case 'APPLY_CSS_PREVIEW': {
        chrome.tabs.sendMessage(activeTab.id, msg, (res) => {
          const result: LivePreviewResult = {
            id: msg.payload.id,
            selector: msg.payload.selector,
            success: res?.success ?? false,
            message: res?.message ?? (chrome.runtime.lastError ? chrome.runtime.lastError.message : undefined),
          };
          this.send({
            type: 'LIVE_PREVIEW_APPLIED',
            payload: result,
            timestamp: Date.now(),
          });
        });
        break;
      }

      case 'CLEAR_CSS_PREVIEW':
      case 'HIGHLIGHT_ELEMENT': {
        chrome.tabs.sendMessage(activeTab.id, msg);
        break;
      }
    }
  }
}

const bridgeService = new ExtensionBridgeService();

// Listen for keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-inspector') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECTOR' });
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_MCP_STATUS') {
    bridgeService.ensureConnected(600).then((connected) => {
      sendResponse({
        connected,
      });
    });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'ELEMENT_CAPTURED') {
    bridgeService.send({
      type: 'ELEMENT_CAPTURED',
      payload: message.payload,
      timestamp: Date.now(),
    });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'CONSOLE_LOGS') {
    bridgeService.send({
      type: 'CONSOLE_LOGS',
      payload: message.payload,
      timestamp: Date.now(),
    });
    return false;
  }

  if (message.type === 'CAPTURE_TAB') {
    chrome.tabs.captureVisibleTab({ format: 'png' })
      .then((dataUrl) => {
        sendResponse({ success: true, dataUrl });
      })
      .catch((err) => {
        console.error('[LetMe Background] Screenshot error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async capture
  }

  // Privileged Cross-Origin Fetch Proxy (bypasses webpage CORS restrictions)
  if (message.type === 'PROXY_AI_REQUEST') {
    const { endpoint, headers, body } = message.payload;
    fetch(endpoint, {
      method: 'POST',
      headers: headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const text = await res.text();
        sendResponse({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          text,
        });
      })
      .catch((err) => {
        console.error('[LetMe Background] AI Proxy error:', err);
        sendResponse({
          ok: false,
          status: 0,
          error: err.message || 'Network request failed',
        });
      });
    return true; // Keep channel open for async fetch
  }

  if (message.type === 'PROXY_HTTP_GET') {
    const { url, headers } = message.payload;
    fetch(url, {
      method: 'GET',
      headers: headers || {},
    })
      .then(async (res) => {
        const text = await res.text();
        sendResponse({
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          text,
        });
      })
      .catch((err) => {
        console.error('[LetMe Background] HTTP GET Proxy error:', err);
        sendResponse({
          ok: false,
          status: 0,
          error: err.message || 'Network request failed',
        });
      });
    return true; // Keep channel open for async fetch
  }

  return false;
});
