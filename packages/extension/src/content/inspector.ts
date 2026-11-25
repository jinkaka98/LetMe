import {
  getBoxModel,
  getContainerContext,
  diagnoseLayoutBugs,
  getUniqueSelector,
  getCleanHtmlSnippet,
  getKeyComputedStyles,
} from './layoutEngine.js';
import { MarkupStudio } from './markupStudio.js';
import { FONT_OPTIONS, LayerTag, OverlayUi, PickedLayer, ShapeToolId, StudioTool } from './overlayUi.js';
import { ElementSnapshot, MarkupAnnotation, McpSnapshotSummary } from '@letme/shared';

const TOOL_HOTKEYS: Record<string, StudioTool> = {
  h: 'hand',
  v: 'pick',
  a: 'arrow',
  l: 'line',
  r: 'ruler',
  b: 'pen',
  t: 'text',
  u: 'blur',
  e: 'eraser',
};

export class ElementInspector {
  private isActive: boolean = false;
  private hoverOverlay: HTMLDivElement | null = null;
  private hoverLabel: HTMLDivElement | null = null;
  private pinElements: Map<string, HTMLDivElement> = new Map();
  private markupStudio: MarkupStudio | null = null;
  private overlayUi: OverlayUi | null = null;
  private latestSnapshot: ElementSnapshot | null = null;

  private layers: PickedLayer[] = [];
  private globalAnnotations: MarkupAnnotation[] = [];
  private activeLayerId: string | null = null;
  private activeTool: StudioTool = 'pick';
  private activeShape: ShapeToolId = 'box';
  private activeColor: string = '#ffffff';
  private activeStrokeWidth: number = 2;
  private activeFontFamily: string = FONT_OPTIONS[3].value; // Arial default
  private multiPick: boolean = true;
  private isDrawerOpen: boolean = false;
  private isPropsOpen: boolean = false;
  private isToolbarCollapsed: boolean = false;
  private showAllPins: boolean = true;
  private openModal: 'shapes' | 'color' | 'raw' | null = null;
  private isMcpPanelOpen: boolean = false;
  private mcpSnapshots: McpSnapshotSummary[] = [];
  private mcpListener: any = null;

  constructor() {
    this.overlayUi = new OverlayUi({
      onSelectLayer: (id) => {
        this.switchToLayer(id);
        this.isPropsOpen = true;
        const layer = this.layers.find((l) => l.id === id);
        layer?.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.syncPins();
        this.renderStudio();
      },
      onDeleteLayer: (id) => {
        this.layers = this.layers.filter((l) => l.id !== id);
        this.layers.forEach((l, idx) => {
          l.index = idx + 1;
        });
        if (this.activeLayerId === id) {
          this.activeLayerId = this.layers[0]?.id || null;
          if (!this.activeLayerId) this.isPropsOpen = false;
          this.loadActiveLayerAnnotations();
        }
        this.syncPins();
        this.renderStudio();
      },
      onToggleLayerVisible: (id) => {
        const layer = this.layers.find((l) => l.id === id);
        if (layer) {
          layer.visible = !layer.visible;
          this.syncPins();
          this.renderStudio();
        }
      },
      onUpdateLayerTag: (id, tag: LayerTag) => {
        const layer = this.layers.find((l) => l.id === id);
        if (layer) {
          layer.tag = tag;
          this.syncPins();
          this.renderStudio();
        }
      },
      onUpdateLayerNote: (id, note: string) => {
        const layer = this.layers.find((l) => l.id === id);
        if (layer) layer.note = note;
      },
      onCloseProps: () => {
        this.isPropsOpen = false;
        this.renderStudio();
      },
      onSetTool: (tool: StudioTool) => this.setTool(this.activeTool === tool ? 'idle' : tool),
      onSelectShape: (shape: ShapeToolId) => {
        this.activeShape = shape;
        this.openModal = null;
        this.setTool(shape);
      },
      onSetColor: (color: string) => {
        this.activeColor = color;
        this.markupStudio?.setColor(color);
        this.renderStudio();
      },
      onSetStrokeWidth: (width: number) => {
        this.activeStrokeWidth = Math.max(1, Math.min(24, width));
        this.markupStudio?.setStrokeWidth(this.activeStrokeWidth);
        this.renderStudio();
      },
      onSetFontFamily: (font: string) => {
        this.activeFontFamily = font;
        this.markupStudio?.setFontFamily(font);
        this.renderStudio();
      },
      onToggleModal: (modal) => {
        this.openModal = modal;
        this.renderStudio();
      },
      onUndo: () => this.markupStudio?.undo(),
      onClearMarkup: () => this.markupStudio?.clear(),
      onToggleMultiPick: () => {
        this.multiPick = !this.multiPick;
        this.renderStudio();
      },
      onToggleDrawer: () => {
        this.isDrawerOpen = !this.isDrawerOpen;
        this.renderStudio();
      },
      onToggleToolbar: () => {
        this.isToolbarCollapsed = !this.isToolbarCollapsed;
        this.openModal = null;
        this.renderStudio();
      },
      onToggleAllPins: () => {
        this.showAllPins = !this.showAllPins;
        this.syncPins();
        this.renderStudio();
      },
      onToggleMcpPanel: () => {
        this.isMcpPanelOpen = !this.isMcpPanelOpen;
        if (this.isMcpPanelOpen) this.refreshMcpSnapshots();
        this.renderStudio();
      },
      onRefreshMcpSnapshots: () => this.refreshMcpSnapshots(),
      onDeleteMcpSnapshot: (id: string) => {
        chrome.runtime.sendMessage({ type: 'DELETE_MCP_SNAPSHOT', payload: { id } }, (res) => {
          if (res?.snapshots) {
            this.mcpSnapshots = res.snapshots;
            this.renderStudio();
          }
        });
      },
      onCopyPrompt: () => this.handleCopyPrompt(),
      onSendToAi: () => this.handleSendToAi(),
      onClose: () => this.stop(),
    });
  }

  isInspecting(): boolean {
    return this.isActive;
  }

  getLatestSnapshot(): ElementSnapshot | null {
    return this.latestSnapshot;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.layers = [];
    this.globalAnnotations = [];
    this.activeLayerId = null;
    this.activeTool = 'pick';
    this.activeShape = 'box';
    this.activeColor = '#ffffff';
    this.activeStrokeWidth = 2;
    this.multiPick = true;
    this.isDrawerOpen = false;
    this.isPropsOpen = false;
    this.isToolbarCollapsed = false;
    this.showAllPins = true;
    this.openModal = null;
    this.isMcpPanelOpen = false;

    this.createHoverElements();
    this.markupStudio?.destroy();
    this.markupStudio = new MarkupStudio(window.innerWidth, window.innerHeight);
    this.markupStudio.setColor(this.activeColor);
    this.markupStudio.setStrokeWidth(this.activeStrokeWidth);
    this.markupStudio.setFontFamily(this.activeFontFamily);
    this.markupStudio.setOnChange((annotations) => {
      const activeLayer = this.layers.find((l) => l.id === this.activeLayerId);
      if (activeLayer) {
        activeLayer.annotations = annotations;
      } else {
        this.globalAnnotations = annotations;
      }
      this.renderStudio();
    });
    document.body.appendChild(this.markupStudio.getCanvasElement());
    this.syncCanvasPointerEvents();

    this.attachEventListeners();
    this.refreshMcpSnapshots();
    this.renderStudio();
  }

  stop() {
    this.isActive = false;
    this.removeHoverElements();
    this.clearAllPins();
    this.detachEventListeners();
    this.markupStudio?.destroy();
    this.markupStudio = null;
    this.overlayUi?.remove();
    this.layers = [];
    this.globalAnnotations = [];
    this.activeLayerId = null;
  }

  toggle() {
    if (this.isActive) this.stop();
    else this.start();
  }

  private switchToLayer(layerId: string) {
    this.activeLayerId = layerId;
    this.loadActiveLayerAnnotations();
  }

  private loadActiveLayerAnnotations() {
    const active = this.layers.find((l) => l.id === this.activeLayerId);
    this.markupStudio?.setAnnotations(active ? active.annotations : this.globalAnnotations);
  }

  private setTool(tool: StudioTool) {
    this.activeTool = tool;
    this.openModal = null;
    this.syncCanvasPointerEvents();
    if (tool !== 'pick' && this.hoverOverlay) {
      this.hoverOverlay.style.display = 'none';
    }
    this.renderStudio();
  }

  private renderStudio() {
    if (!this.isActive) return;
    this.overlayUi?.render({
      layers: this.layers,
      activeLayerId: this.activeLayerId,
      activeTool: this.activeTool,
      activeShape: this.activeShape,
      activeColor: this.activeColor,
      activeStrokeWidth: this.activeStrokeWidth,
      activeFontFamily: this.activeFontFamily,
      multiPick: this.multiPick,
      isDrawerOpen: this.isDrawerOpen,
      isPropsOpen: this.isPropsOpen,
      isToolbarCollapsed: this.isToolbarCollapsed,
      showAllPins: this.showAllPins,
      openModal: this.openModal,
      rawPreviewText: this.buildRawPromptText(),
      isMcpPanelOpen: this.isMcpPanelOpen,
      mcpSnapshots: this.mcpSnapshots,
    });
  }

  private syncCanvasPointerEvents() {
    if (!this.markupStudio) return;
    const canvas = this.markupStudio.getCanvasElement();
    if (this.activeTool === 'pick' || this.activeTool === 'idle') {
      canvas.style.pointerEvents = 'none';
    } else if (this.activeTool === 'hand') {
      canvas.style.pointerEvents = 'auto';
      this.markupStudio.setTool('select');
    } else {
      canvas.style.pointerEvents = 'auto';
      this.markupStudio.setTool(this.activeTool);
    }
  }

  private refreshMcpSnapshots() {
    chrome.runtime.sendMessage({ type: 'GET_MCP_SNAPSHOTS' }, (res) => {
      if (res?.snapshots) {
        this.mcpSnapshots = res.snapshots;
        this.renderStudio();
      }
    });
  }

  private createHoverElements() {
    if (this.hoverOverlay) return;
    this.hoverOverlay = document.createElement('div');
    this.hoverOverlay.id = 'letme-hover-overlay';
    this.hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;background:rgba(255,255,255,0.08);border:1.5px solid #ffffff;display:none;transition:all 0.05s ease-out;';
    this.hoverLabel = document.createElement('div');
    this.hoverLabel.id = 'letme-hover-label';
    this.hoverLabel.style.cssText = 'position:absolute;top:-22px;left:-1px;background:#050505;color:#fff;border:1px solid #fff;padding:2px 6px;border-radius:3px;font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700;white-space:nowrap;width:max-content;line-height:1.1;';
    this.hoverOverlay.appendChild(this.hoverLabel);
    document.body.appendChild(this.hoverOverlay);
  }

  private removeHoverElements() {
    this.hoverOverlay?.remove();
    this.hoverOverlay = null;
    this.hoverLabel = null;
  }

  private clearAllPins() {
    this.pinElements.forEach((pin) => pin.remove());
    this.pinElements.clear();
  }

  private createCornerHandle(pos: 'tl' | 'tr' | 'bl' | 'br'): HTMLSpanElement {
    const h = document.createElement('span');
    h.style.cssText = 'position:absolute;width:6px;height:6px;background:#fff;border:1px solid #050505;box-sizing:border-box;';
    if (pos.includes('t')) h.style.top = '-3px';
    if (pos.includes('b')) h.style.bottom = '-3px';
    if (pos.includes('l')) h.style.left = '-3px';
    if (pos.includes('r')) h.style.right = '-3px';
    return h;
  }

  private syncPins() {
    this.clearAllPins();
    if (!this.showAllPins) return;

    for (const layer of this.layers) {
      if (!layer.visible) continue;
      const rect = layer.element.getBoundingClientRect();
      const isActive = layer.id === this.activeLayerId;

      const pin = document.createElement('div');
      pin.className = 'letme-layer-pin';
      pin.style.cssText = `position:fixed;box-sizing:border-box;left:${rect.left}px;top:${rect.top}px;width:${Math.max(2, rect.width)}px;height:${Math.max(2, rect.height)}px;border:${isActive ? '2px solid #ffffff' : '1px dashed rgba(255,255,255,0.8)'};background:${isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'};pointer-events:none;z-index:${isActive ? '2147483645' : '2147483644'};`;

      (['tl', 'tr', 'bl', 'br'] as const).forEach((pos) => pin.appendChild(this.createCornerHandle(pos)));

      const badge = document.createElement('span');
      badge.style.cssText = `position:absolute;left:-1px;${rect.top < 24 ? 'bottom:-19px;' : 'top:-19px;'}background:${isActive ? '#ffffff' : '#050505'};color:${isActive ? '#000000' : '#ffffff'};border:1px solid #ffffff;padding:2px 6px;border-radius:3px;font-size:10px;line-height:1.1;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;width:max-content;`;
      badge.innerText = `#${layer.index} ${layer.tag.toUpperCase()}`;
      pin.appendChild(badge);

      if (isActive) {
        const dim = document.createElement('span');
        dim.style.cssText = 'position:absolute;right:-1px;bottom:-18px;background:#050505;color:#d4d4d8;border:1px solid #3f3f46;padding:1px 5px;border-radius:3px;font-size:9px;line-height:1.1;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;width:max-content;';
        dim.innerText = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
        pin.appendChild(dim);
      }

      document.body.appendChild(pin);
      this.pinElements.set(layer.id, pin);
    }
  }

  private onReposition = () => {
    if (this.isActive && this.layers.length > 0) this.syncPins();
  };

  private attachEventListeners() {
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('scroll', this.onReposition, true);
    window.addEventListener('resize', this.onReposition);

    this.mcpListener = (msg: any) => {
      if (msg.type === 'MCP_SNAPSHOTS_UPDATED') {
        this.mcpSnapshots = msg.snapshots || [];
        this.renderStudio();
      }
    };
    chrome.runtime.onMessage.addListener(this.mcpListener);
  }

  private detachEventListeners() {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('scroll', this.onReposition, true);
    window.removeEventListener('resize', this.onReposition);
    if (this.mcpListener) {
      chrome.runtime.onMessage.removeListener(this.mcpListener);
      this.mcpListener = null;
    }
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isActive || this.activeTool !== 'pick') return;
    const target = this.getElementFromCursor(e);
    if (!target || !this.hoverOverlay || !this.hoverLabel) {
      if (this.hoverOverlay) this.hoverOverlay.style.display = 'none';
      return;
    }
    const rect = target.getBoundingClientRect();
    this.hoverOverlay.style.display = 'block';
    this.hoverOverlay.style.top = `${rect.top}px`;
    this.hoverOverlay.style.left = `${rect.left}px`;
    this.hoverOverlay.style.width = `${rect.width}px`;
    this.hoverOverlay.style.height = `${rect.height}px`;
    const tag = target.tagName.toLowerCase();
    const id = target.id ? `#${target.id}` : '';
    const firstClass = target.classList.length > 0 ? `.${target.classList[0]}` : '';
    this.hoverLabel.innerText = `<${tag}${id}${firstClass}> ${Math.round(rect.width)}×${Math.round(rect.height)}px`;
    this.hoverLabel.style.top = rect.top < 24 ? '4px' : '-22px';
  };

  private onClick = (e: MouseEvent) => {
    if (!this.isActive || this.activeTool !== 'pick') return;
    const target = e.target as HTMLElement;
    if (target.closest('[id^="letme-"]') || target.closest('[class*="letme-"]')) return;
    e.preventDefault();
    e.stopPropagation();
    const clickedEl = this.getElementFromCursor(e);
    if (!clickedEl) return;
    this.addOrSelectElement(clickedEl);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.isActive) return;
    if (e.key === 'Escape') {
      if (this.openModal) {
        this.openModal = null;
        this.renderStudio();
        return;
      }
      this.stop();
      return;
    }

    const composedTarget = e.composedPath()[0] as HTMLElement | undefined;
    const isEditable =
      !!composedTarget &&
      (composedTarget.tagName === 'INPUT' ||
        composedTarget.tagName === 'TEXTAREA' ||
        composedTarget.tagName === 'SELECT' ||
        composedTarget.isContentEditable);
    if (isEditable || e.ctrlKey || e.altKey || e.metaKey) return;

    const k = e.key.toLowerCase();
    if (k === 's') {
      e.preventDefault();
      this.setTool(this.activeShape);
      return;
    }
    const tool = TOOL_HOTKEYS[k];
    if (tool) {
      e.preventDefault();
      this.setTool(tool);
    }
  };

  private getElementFromCursor(e: MouseEvent): HTMLElement | null {
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'hidden';
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'visible';
    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.closest('[id^="letme-"]') || el.closest('[class*="letme-"]')) return null;
    return el;
  }

  private async captureLayerThumbnail(layerId: string, rect: DOMRect) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const dataUrl: string = response?.dataUrl;
      if (!dataUrl) return;
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });
      const dpr = img.width / Math.max(1, window.innerWidth);
      const pad = 8;
      const sx = Math.max(0, (rect.left - pad) * dpr);
      const sy = Math.max(0, (rect.top - pad) * dpr);
      const sw = Math.min(img.width - sx, Math.max(20, (rect.width + pad * 2) * dpr));
      const sh = Math.min(img.height - sy, Math.max(20, (rect.height + pad * 2) * dpr));
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 240 / sw);
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const layer = this.layers.find((l) => l.id === layerId);
      if (layer) {
        layer.thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.renderStudio();
      }
    } catch {}
  }

  private addOrSelectElement(element: HTMLElement) {
    const existing = this.layers.find((l) => l.element === element);
    if (existing) {
      this.switchToLayer(existing.id);
      this.isDrawerOpen = true;
      this.isPropsOpen = true;
      this.syncPins();
      this.renderStudio();
      return;
    }

    if (!this.multiPick) this.layers = [];

    const rect = element.getBoundingClientRect();
    const layer: PickedLayer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      index: this.layers.length + 1,
      element,
      selector: getUniqueSelector(element),
      tagName: element.tagName.toLowerCase(),
      boxModel: getBoxModel(element),
      layoutBugs: diagnoseLayoutBugs(element),
      tag: 'design',
      note: '',
      visible: true,
      annotations: this.layers.length === 0 ? [...this.globalAnnotations] : [],
    };

    this.layers.push(layer);
    this.globalAnnotations = [];
    this.switchToLayer(layer.id);
    this.isDrawerOpen = true;
    this.isPropsOpen = true;
    this.syncPins();
    this.renderStudio();
    this.captureLayerThumbnail(layer.id, rect);
  }

  private buildCombinedNotes(): { instructions: string; bugNotes: string } {
    const instructionLines: string[] = [];
    const bugLines: string[] = [];

    for (const layer of this.layers) {
      const markInfo = layer.annotations.length > 0 ? ` [${layer.annotations.length} markup(s)]` : '';
      const header = `#${layer.index} [${layer.tag.toUpperCase()}] <${layer.tagName}> \`${layer.selector}\` (${layer.boxModel.width}x${layer.boxModel.height}px)${markInfo}`;
      const noteText = layer.note.trim() || '(no extra note)';
      if (layer.tag === 'bug') bugLines.push(`${header}: ${noteText}`);
      else instructionLines.push(`${header}: ${noteText}`);
      if (layer.layoutBugs.warnings.length > 0) {
        bugLines.push(`  Auto-detected: ${layer.layoutBugs.warnings.join('; ')}`);
      }
    }

    return {
      instructions: instructionLines.join('\n'),
      bugNotes: bugLines.join('\n'),
    };
  }

  private buildRawPromptText(): string {
    if (this.layers.length === 0) return '';
    const { instructions, bugNotes } = this.buildCombinedNotes();
    return [
      `### LetMe Inspector (${this.layers.length} Layer${this.layers.length > 1 ? 's' : ''})`,
      `URL: ${window.location.href}`,
      instructions ? `**Design / Edit / Notes:**\n${instructions}` : '',
      bugNotes ? `**Bugs:**\n${bugNotes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private handleCopyPrompt() {
    if (this.layers.length === 0) {
      this.overlayUi?.showToast('Pick at least 1 element first.', true);
      return;
    }
    navigator.clipboard.writeText(this.buildRawPromptText());
    this.overlayUi?.showToast('Prompt copied to clipboard!');
  }

  private async handleSendToAi() {
    if (this.layers.length === 0 || !this.markupStudio) {
      this.overlayUi?.showToast('Pick at least 1 element first.', true);
      return;
    }

    const primaryLayer = this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0];
    const targetEl = primaryLayer.element;
    this.overlayUi?.showToast('Capturing screenshot and analyzing layers...');

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const rawScreenshotUrl: string = response?.dataUrl || '';

      const selector = primaryLayer.selector;
      const boxModel = getBoxModel(targetEl);
      const layoutContext = getContainerContext(targetEl);
      const layoutBugs = diagnoseLayoutBugs(targetEl);
      const computedStyles = getKeyComputedStyles(targetEl);
      const outerHtml = getCleanHtmlSnippet(targetEl);
      const innerText = targetEl.innerText?.substring(0, 500);

      let annotatedScreenshotBase64: string | undefined;
      if (rawScreenshotUrl) {
        const cropBox = this.layers.length === 1 ? boxModel.boundingBox : undefined;
        annotatedScreenshotBase64 = await this.markupStudio.exportAnnotatedScreenshot(rawScreenshotUrl, cropBox);
      }

      const { instructions, bugNotes } = this.buildCombinedNotes();
      const allAnnotations = this.layers.flatMap((l) => l.annotations);

      const snapshot: ElementSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        url: window.location.href,
        pageTitle: document.title,
        selector,
        tagName: targetEl.tagName.toLowerCase(),
        idAttribute: targetEl.id || undefined,
        classNames: Array.from(targetEl.classList),
        outerHtmlSnippet: outerHtml,
        innerTextSnippet: innerText,
        boxModel,
        layoutContext,
        layoutBugs,
        computedStyles,
        screenshotBase64: annotatedScreenshotBase64,
        userInstructions: instructions || undefined,
        userBugNotes: bugNotes || undefined,
        annotations: allAnnotations,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      };

      this.latestSnapshot = snapshot;
      chrome.runtime.sendMessage({ type: 'ELEMENT_CAPTURED', payload: snapshot }, (res) => {
        if (res?.snapshots) {
          this.mcpSnapshots = res.snapshots;
          this.renderStudio();
        }
      });
      this.overlayUi?.showToast(`Sent ${this.layers.length} layer(s) to AI via MCP!`);
    } catch (err: any) {
      console.error('[LetMe] Error capturing element:', err);
      this.overlayUi?.showToast(`Error sending: ${err.message}`, true);
    }
  }
}

export const elementInspector = new ElementInspector();
