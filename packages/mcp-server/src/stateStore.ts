import {
  ElementSnapshot,
  ConsoleLogEntry,
  LivePreviewRequest,
  LivePreviewResult,
} from '@letme/shared';

export interface ConnectedTabInfo {
  id: string;
  url: string;
  title: string;
  connectedAt: number;
}

export class StateStore {
  private activeElement: ElementSnapshot | null = null;
  private snapshots: ElementSnapshot[] = [];
  private consoleLogs: ConsoleLogEntry[] = [];
  private connectedTabs: Map<string, ConnectedTabInfo> = new Map();
  private pendingPreviews: Map<
    string,
    { resolve: (result: LivePreviewResult) => void; reject: (err: Error) => void; timer: NodeJS.Timeout }
  > = new Map();

  setActiveElement(element: ElementSnapshot) {
    this.activeElement = element;
    // Add to list and keep last 20
    this.snapshots.unshift(element);
    if (this.snapshots.length > 20) {
      this.snapshots.pop();
    }
  }

  getActiveElement(): ElementSnapshot | null {
    return this.activeElement;
  }

  getSnapshots(): ElementSnapshot[] {
    return this.snapshots;
  }

  clearSnapshots() {
    this.snapshots = [];
    this.activeElement = null;
  }

  deleteSnapshot(id: string): boolean {
    const idx = this.snapshots.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.snapshots.splice(idx, 1);
    if (this.activeElement?.id === id) {
      this.activeElement = this.snapshots[0] || null;
    }
    return true;
  }

  resolveSnapshot(id?: string, resolutionNote?: string): ElementSnapshot | null {
    const target = id
      ? this.snapshots.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase()) || null
      : this.activeElement;
    if (!target) return null;
    target.status = 'resolved';
    if (resolutionNote?.trim()) {
      target.resolutionNote = resolutionNote.trim();
    }
    return target;
  }

  addConsoleLogs(logs: ConsoleLogEntry[]) {
    this.consoleLogs.push(...logs);
    if (this.consoleLogs.length > 100) {
      this.consoleLogs = this.consoleLogs.slice(-100);
    }
  }

  getConsoleLogs(): ConsoleLogEntry[] {
    return this.consoleLogs;
  }

  registerTab(clientKey: string, info: ConnectedTabInfo) {
    this.connectedTabs.set(clientKey, info);
  }

  unregisterTab(clientKey: string) {
    this.connectedTabs.delete(clientKey);
  }

  getConnectedTabs(): ConnectedTabInfo[] {
    return Array.from(this.connectedTabs.values());
  }

  hasConnectedTabs(): boolean {
    return this.connectedTabs.size > 0;
  }

  registerPendingPreview(
    previewId: string,
    resolve: (result: LivePreviewResult) => void,
    reject: (err: Error) => void,
    timeoutMs: number = 5000
  ) {
    const timer = setTimeout(() => {
      this.pendingPreviews.delete(previewId);
      reject(new Error(`Live preview request timed out after ${timeoutMs}ms (no response from browser)`));
    }, timeoutMs);

    this.pendingPreviews.set(previewId, { resolve, reject, timer });
  }

  resolvePendingPreview(result: LivePreviewResult) {
    const pending = this.pendingPreviews.get(result.id);
    if (pending) {
      clearTimeout(pending.timer);
      pending.resolve(result);
      this.pendingPreviews.delete(result.id);
    }
  }
}

export const globalStore = new StateStore();
