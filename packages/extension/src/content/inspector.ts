import {
  getBoxModel,
  getContainerContext,
  diagnoseLayoutBugs,
  getUniqueSelector,
  getCleanHtmlSnippet,
  getKeyComputedStyles,
} from './layoutEngine.js';
import { MarkupStudio } from './markupStudio.js';
import { screenshotTool } from './screenshotTool.js';
import { ScrEditorModal, ScreenshotLayerItem } from './scrEditorModal.js';
import { autoBugDetector } from './autoBugDetector.js';
import {
  CopyHistoryItem,
  FONT_OPTIONS,
  InspectorTab,
  LayerTag,
  OverlayUi,
  PickedLayer,
  ScrCaptureMode,
  ScrConfig,
  ShapeToolId,
  StudioTool,
} from './overlayUi.js';
import {
  ElementSnapshot,
  LayerSnapshotDetail,
  MarkupAnnotation,
  McpSnapshotSummary,
  SemanticAnchors,
  SourceContextInfo,
} from 'letme-shared';

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
  private isFinalNotesOpen: boolean = false;
  private openModal: 'shapes' | 'color' | 'raw' | null = null;
  private rawPreviewText: string = '';
  private finalInstructions: string = '';
  private isRightSliderOpen: boolean = false;
  private rightSliderTab: 'mcp' | 'history' = 'mcp';
  private inspectorTab: InspectorTab = 'layers';
  private scrConfig: ScrConfig = {
    includeMarkup: true,
    hideHud: true,
    padding: 16,
    format: 'png',
    autoCopy: true,
  };
  private screenshots: ScreenshotLayerItem[] = [];
  private scrEditor = new ScrEditorModal();
  private aiSummary: { provider: string; model: string; hasKey: boolean } = {
    provider: 'openrouter',
    model: 'default',
    hasKey: false,
  };
  private mcpSnapshots: McpSnapshotSummary[] = [];
  private copyHistory: CopyHistoryItem[] = [];
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
      onOpenLayerRaw: (id) => {
        this.rawPreviewText = this.buildLayerRawPreview(id);
        this.openModal = 'raw';
        this.renderStudio();
      },
      onCopyLayer: (id) => this.handleCopySingleLayer(id),
      onSwitchInspectorTab: (tab) => {
        this.inspectorTab = tab;
        if (tab === 'ai') this.loadAiSummary();
        this.renderStudio();
      },
      onRunScrCapture: (mode: ScrCaptureMode) => this.handleStudioScreenshot(mode),
      onToggleScrOption: (key) => {
        this.scrConfig[key] = !this.scrConfig[key];
        this.renderStudio();
      },
      onCycleScrPadding: () => {
        const order: (0 | 16 | 32)[] = [0, 16, 32];
        this.scrConfig.padding = order[(order.indexOf(this.scrConfig.padding) + 1) % order.length];
        this.renderStudio();
      },
      onToggleScrFormat: () => {
        this.scrConfig.format = this.scrConfig.format === 'png' ? 'jpeg' : 'png';
        this.renderStudio();
      },
      onEditScreenshot: (id) => {
        const item = this.screenshots.find((s) => s.id === id);
        if (!item) return;
        this.scrEditor.open(item, {
          onSave: (itemId, updatedDataUrl, caption, frame, annotations) => {
            const target = this.screenshots.find((s) => s.id === itemId);
            if (target) {
              target.dataUrl = updatedDataUrl;
              target.caption = caption;
              target.frame = frame;
              target.annotations = annotations;
              this.renderStudio();
              this.overlayUi?.showToast(`${target.name} updated!`);
            }
          },
          onCopyImage: (url, caption, frame, annotations) => {
            item.dataUrl = url;
            item.caption = caption;
            item.frame = frame;
            item.annotations = annotations;
            this.renderStudio();
            this.copyDataUrlToClipboard(url, caption);
          },
          onDownload: (url, fname) => this.downloadDataUrl(url, fname),
          onSendToAi: (scrItem, updatedUrl, caption, annotations) => {
            scrItem.dataUrl = updatedUrl;
            scrItem.caption = caption;
            scrItem.annotations = annotations;
            this.sendScreenshotToMcp(scrItem);
          },
        });
      },
      onCopyScreenshot: (id) => {
        const item = this.screenshots.find((s) => s.id === id);
        if (item) this.copyDataUrlToClipboard(item.dataUrl, item.caption);
      },
      onDownloadScreenshot: (id) => {
        const item = this.screenshots.find((s) => s.id === id);
        if (item) this.downloadDataUrl(item.dataUrl, `${item.name.toLowerCase().replace(/\s+/g, '-')}.${this.scrConfig.format}`);
      },
      onSendScreenshotToAi: (id) => {
        const item = this.screenshots.find((s) => s.id === id);
        if (item) this.sendScreenshotToMcp(item);
      },
      onDeleteScreenshot: (id) => {
        this.screenshots = this.screenshots.filter((s) => s.id !== id);
        this.screenshots.forEach((s, idx) => { s.index = idx + 1; s.name = `SCR ${idx + 1}`; });
        this.renderStudio();
      },
      onRunAiVisionScan: () => {
        this.stop();
        autoBugDetector.runDetection();
      },
      onOpenFullRaw: () => {
        this.rawPreviewText = this.buildStructuredCopyPrompt() || 'No layers picked yet.';
        this.openModal = 'raw';
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
      onClearAllLayers: () => {
        this.layers = [];
        this.activeLayerId = null;
        this.isPropsOpen = false;
        this.globalAnnotations = [];
        this.markupStudio?.setAnnotations([]);
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
      onToggleFinalNotes: () => {
        this.isFinalNotesOpen = !this.isFinalNotesOpen;
        this.renderStudio();
      },
      onUpdateFinalInstructions: (text: string) => {
        this.finalInstructions = text;
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
      onRedo: () => this.markupStudio?.redo(),
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
      onToggleRightSlider: () => {
        this.isRightSliderOpen = !this.isRightSliderOpen;
        if (this.isRightSliderOpen) this.refreshMcpSnapshots();
        this.renderStudio();
      },
      onSwitchRightTab: (tab: 'mcp' | 'history') => {
        this.rightSliderTab = tab;
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
      onRecopyHistoryItem: (id: string) => {
        const item = this.copyHistory.find((h) => h.id === id);
        if (item) {
          navigator.clipboard.writeText(item.text);
          this.overlayUi?.showToast('Copied from history!');
        }
      },
      onDeleteHistoryItem: (id: string) => {
        this.copyHistory = this.copyHistory.filter((h) => h.id !== id);
        this.renderStudio();
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
    this.isFinalNotesOpen = false;
    this.openModal = null;
    this.rawPreviewText = '';
    this.finalInstructions = '';
    this.isRightSliderOpen = false;

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
    this.loadAiSummary();
    this.renderStudio();
  }

  private loadAiSummary() {
    chrome.storage.local.get(['aiProvider', 'aiModel', 'aiApiKey']).then((data) => {
      const provider = data.aiProvider || 'openrouter';
      this.aiSummary = {
        provider,
        model: data.aiModel || 'default',
        hasKey: Boolean(data.aiApiKey) || provider === 'ollama',
      };
      this.renderStudio();
    });
  }

  stop() {
    this.isActive = false;
    this.removeHoverElements();
    this.clearAllPins();
    this.detachEventListeners();
    this.markupStudio?.destroy();
    this.markupStudio = null;
    this.scrEditor.close();
    this.overlayUi?.remove();
    this.layers = [];
    this.screenshots = [];
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
      isFinalNotesOpen: this.isFinalNotesOpen,
      openModal: this.openModal,
      rawPreviewText: this.rawPreviewText,
      finalInstructions: this.finalInstructions,
      isRightSliderOpen: this.isRightSliderOpen,
      rightSliderTab: this.rightSliderTab,
      inspectorTab: this.inspectorTab,
      scrConfig: this.scrConfig,
      screenshots: this.screenshots,
      aiSummary: this.aiSummary,
      mcpSnapshots: this.mcpSnapshots,
      copyHistory: this.copyHistory,
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
      semanticAnchors: this.extractSemanticAnchors(element),
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
    this.probeSourceContext(element).then((src) => {
      if (!src) return;
      const target = this.layers.find((l) => l.id === layer.id);
      if (target) {
        target.sourceContext = src;
        this.renderStudio();
      }
    });
  }

  private extractSemanticAnchors(el: HTMLElement): SemanticAnchors | undefined {
    const ariaLabel = el.getAttribute('aria-label')?.trim() || undefined;
    const role = el.getAttribute('role')?.trim() || undefined;
    const dataTestId =
      el.getAttribute('data-testid')?.trim() ||
      el.getAttribute('data-test-id')?.trim() ||
      el.getAttribute('data-cy')?.trim() ||
      undefined;

    let nearestHeading: string | undefined;
    let curr: HTMLElement | null = el;
    let depth = 0;
    while (curr && depth < 6 && !nearestHeading) {
      const heading = curr.querySelector('h1, h2, h3, h4') as HTMLElement | null;
      if (heading?.innerText?.trim()) {
        nearestHeading = heading.innerText.trim().slice(0, 80);
        break;
      }
      curr = curr.parentElement;
      depth++;
    }

    if (!ariaLabel && !role && !dataTestId && !nearestHeading) return undefined;
    return { nearestHeading, ariaLabel, role, dataTestId };
  }

  private probeSourceContext(el: HTMLElement): Promise<SourceContextInfo | undefined> {
    return new Promise((resolve) => {
      const marker = `ltm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const id = `req_${marker}`;
      let settled = false;

      const cleanup = () => {
        el.removeAttribute('data-letme-probe');
        document.removeEventListener('letme-bridge:response', onResponse);
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(undefined);
      }, 250);

      const onResponse = (event: Event) => {
        const detail = (event as CustomEvent<{ id?: string; result?: SourceContextInfo | null }>).detail;
        if (detail?.id !== id || settled) return;
        settled = true;
        clearTimeout(timer);
        cleanup();
        resolve(detail.result || undefined);
      };

      try {
        el.setAttribute('data-letme-probe', marker);
        document.addEventListener('letme-bridge:response', onResponse);
        document.dispatchEvent(new CustomEvent('letme-bridge:request', { detail: { id, marker } }));
      } catch {
        clearTimeout(timer);
        cleanup();
        resolve(undefined);
      }
    });
  }

  private formatAnnotationLine(ann: MarkupAnnotation, idx: number): string {
    const color = ann.color ? ` [${ann.color}]` : '';
    const stroke = ann.strokeWidth ? ` (${ann.strokeWidth}px)` : '';
    const rot = ann.rotation ? ` [rotated ${Math.round((ann.rotation * 180) / Math.PI)}°]` : '';
    const detail =
      ann.type === 'text'
        ? `"${ann.text || ''}"`
        : ann.type === 'sticky'
          ? `Sticky Note [${ann.stickyTheme || 'amber'}]: "${ann.text || ''}"`
          : ann.type === 'ruler'
            ? `Measured ${ann.text || '0px'}`
            : ann.type === 'blur'
              ? 'Censored region'
              : ann.text || `${ann.type} marker`;
    return `  ${idx + 1}. **${ann.type.toUpperCase()}**${color}${stroke}${rot}: ${detail}`;
  }

  private buildLayerDetailSnapshot(layer: PickedLayer): LayerSnapshotDetail {
    const el = layer.element;
    return {
      index: layer.index,
      tag: layer.tag,
      selector: layer.selector,
      tagName: layer.tagName,
      note: layer.note.trim() || undefined,
      outerHtmlSnippet: getCleanHtmlSnippet(el),
      innerTextSnippet: el.innerText?.substring(0, 300) || undefined,
      boxModel: getBoxModel(el),
      layoutContext: getContainerContext(el),
      layoutBugs: diagnoseLayoutBugs(el),
      computedStyles: getKeyComputedStyles(el),
      sourceContext: layer.sourceContext,
      semanticAnchors: layer.semanticAnchors,
      annotations: layer.annotations,
    };
  }

  private formatLayerPromptSection(detail: LayerSnapshotDetail): string {
    const bm = detail.boxModel;
    const ctx = detail.layoutContext;
    const lines: string[] = [
      `## Layer #${detail.index} — Focus: [${detail.tag.toUpperCase()}] \`<${detail.tagName}>\` \`${detail.selector}\``,
      `- **User Instruction / Note**: ${detail.note || '(no specific note)'}`,
      `- **Box Model**: ${bm.width}×${bm.height}px | Margin: ${bm.margin.top}/${bm.margin.right}/${bm.margin.bottom}/${bm.margin.left} | Padding: ${bm.padding.top}/${bm.padding.right}/${bm.padding.bottom}/${bm.padding.left}`,
      `- **Parent Context**: \`${ctx.parentTagName}\` (\`${ctx.parentSelector}\`, display: \`${ctx.display}\`, position: \`${ctx.position}\`)`,
    ];

    if (detail.sourceContext) {
      const sc = detail.sourceContext;
      const parts: string[] = [`Framework: \`${sc.framework}\``];
      if (sc.componentName) parts.push(`Component: \`${sc.componentName}\``);
      if (sc.ownerChain?.length) parts.push(`Owner Chain: \`${sc.ownerChain.join(' -> ')}\``);
      if (sc.filePath) parts.push(`Source: \`${sc.filePath}${sc.lineRange ? `:${sc.lineRange}` : ''}\``);
      lines.push(`- **Component & Source Mapping**: ${parts.join(' | ')}`);
    }
    if (detail.semanticAnchors) {
      const sa = detail.semanticAnchors;
      const anchors: string[] = [];
      if (sa.nearestHeading) anchors.push(`Heading: "${sa.nearestHeading}"`);
      if (sa.ariaLabel) anchors.push(`aria-label: "${sa.ariaLabel}"`);
      if (sa.role) anchors.push(`role: \`${sa.role}\``);
      if (sa.dataTestId) anchors.push(`data-testid: \`${sa.dataTestId}\``);
      if (anchors.length > 0) lines.push(`- **Semantic Anchors**: ${anchors.join(' | ')}`);
    }

    if (ctx.isFlexChild && ctx.flexParent) {
      lines.push(`- **Flex Parent**: direction=\`${ctx.flexParent.flexDirection}\`, justify=\`${ctx.flexParent.justifyContent}\`, align=\`${ctx.flexParent.alignItems}\`, gap=\`${ctx.flexParent.gap}\``);
    }
    if (ctx.isGridChild && ctx.gridParent) {
      lines.push(`- **Grid Parent**: cols=\`${ctx.gridParent.gridTemplateColumns}\`, gap=\`${ctx.gridParent.gap}\``);
    }
    if (detail.layoutBugs.warnings.length > 0) {
      lines.push(`- **Auto Layout Diagnostics**: ${detail.layoutBugs.warnings.join('; ')}`);
    }
    if (detail.annotations.length > 0) {
      lines.push(`- **Visual Markups (${detail.annotations.length})**:`);
      detail.annotations.forEach((ann, i) => lines.push(this.formatAnnotationLine(ann, i)));
    }
    lines.push('```html');
    lines.push(detail.outerHtmlSnippet);
    lines.push('```');
    lines.push('```css');
    for (const [prop, val] of Object.entries(detail.computedStyles)) {
      lines.push(`${prop}: ${val};`);
    }
    lines.push('```');
    return lines.join('\n');
  }

  private buildLayerRawPreview(layerId: string): string {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return 'Layer not found.';
    return this.formatLayerPromptSection(this.buildLayerDetailSnapshot(layer));
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

  private buildStructuredCopyPrompt(): string {
    if (this.layers.length === 0) return '';
    const sections = [
      `# LetMe UI/UX Inspection Prompt`,
      `- **Page**: ${document.title}`,
      `- **URL**: ${window.location.href}`,
      `- **Viewport**: ${window.innerWidth}×${window.innerHeight} (DPR ${window.devicePixelRatio || 1})`,
      `- **Total Picked Layers**: ${this.layers.length}`,
      '',
      ...this.layers.map((l) => this.formatLayerPromptSection(this.buildLayerDetailSnapshot(l))),
    ];

    if (this.finalInstructions.trim()) {
      sections.push('');
      sections.push('## Additional Final Instructions');
      sections.push(this.finalInstructions.trim());
    }

    return sections.join('\n');
  }

  private async handleStudioScreenshot(mode: ScrCaptureMode) {
    let cropRect: DOMRect | null = null;

    if (mode === 'layer') {
      const activeLayer = this.layers.find((l) => l.id === this.activeLayerId) || this.layers[0];
      if (!activeLayer) {
        this.overlayUi?.showToast('Pick a layer first for Active Layer capture.', true);
        return;
      }
      const r = activeLayer.element.getBoundingClientRect();
      const pad = this.scrConfig.padding;
      cropRect = new DOMRect(
        Math.max(0, r.left - pad),
        Math.max(0, r.top - pad),
        r.width + pad * 2,
        r.height + pad * 2
      );
    } else if (mode === 'area') {
      this.overlayUi?.setHostVisible(false);
      cropRect = await screenshotTool.selectAreaOnly();
      this.overlayUi?.setHostVisible(true);
      if (!cropRect) return;
    } else if (mode === 'delay') {
      for (const sec of [3, 2, 1]) {
        this.overlayUi?.showToast(`Capturing in ${sec}s...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (this.scrConfig.hideHud) {
      this.overlayUi?.setHostVisible(false);
      await new Promise((r) => setTimeout(r, 60));
    }

    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const rawUrl: string = response?.dataUrl || '';
      if (!rawUrl) throw new Error('Capture failed');

      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = rawUrl;
      });

      const dpr = img.width / Math.max(1, window.innerWidth);
      const canvas = document.createElement('canvas');
      if (cropRect) {
        canvas.width = Math.max(1, Math.round(cropRect.width * dpr));
        canvas.height = Math.max(1, Math.round(cropRect.height * dpr));
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d')!;
      if (cropRect) {
        ctx.drawImage(
          img,
          Math.round(cropRect.left * dpr),
          Math.round(cropRect.top * dpr),
          Math.round(cropRect.width * dpr),
          Math.round(cropRect.height * dpr),
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else {
        ctx.drawImage(img, 0, 0);
      }

      if (this.scrConfig.includeMarkup && this.markupStudio) {
        const markupCanvas = this.markupStudio.getCanvasElement();
        if (cropRect) {
          ctx.drawImage(
            markupCanvas,
            cropRect.left,
            cropRect.top,
            cropRect.width,
            cropRect.height,
            0,
            0,
            canvas.width,
            canvas.height
          );
        } else {
          ctx.drawImage(markupCanvas, 0, 0, canvas.width, canvas.height);
        }
      }

      const mime = this.scrConfig.format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const finalUrl = canvas.toDataURL(mime, 0.92);
      const idx = this.screenshots.length + 1;
      const item: ScreenshotLayerItem = {
        id: `scr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        index: idx,
        name: `SCR ${idx}`,
        mode,
        dataUrl: finalUrl,
        originalDataUrl: finalUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
        caption: '',
        frame: 'none',
      };

      this.screenshots.push(item);
      if (this.scrConfig.autoCopy) {
        await this.copyDataUrlToClipboard(finalUrl);
      } else {
        this.overlayUi?.showToast(`${item.name} captured!`);
      }
    } catch (err: any) {
      this.overlayUi?.showToast(`Screenshot error: ${err.message}`, true);
    } finally {
      this.overlayUi?.setHostVisible(true);
      this.renderStudio();
    }
  }

  private async copyDataUrlToClipboard(dataUrl: string, caption?: string) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const trimmed = caption?.trim();
      if (trimmed) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
              'text/plain': new Blob([trimmed], { type: 'text/plain' }),
            }),
          ]);
          this.overlayUi?.showToast('Screenshot + caption saved & copied!');
          return;
        } catch {
          // Fallback to image-only ClipboardItem if multi-MIME is rejected
        }
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      this.overlayUi?.showToast('Screenshot copied to clipboard!');
    } catch {
      this.overlayUi?.showToast('Saved to SCR list (clipboard unavailable).');
    }
  }

  private downloadDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  private sendScreenshotToMcp(item: ScreenshotLayerItem) {
    const snapshot: ElementSnapshot = {
      id: item.id,
      timestamp: Date.now(),
      url: window.location.href,
      pageTitle: document.title,
      selector: `screenshot:${item.mode}`,
      tagName: 'screenshot',
      classNames: [],
      outerHtmlSnippet: `<!-- ${item.name} (${item.width}x${item.height}px) -->`,
      boxModel: {
        width: item.width,
        height: item.height,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        border: { top: 0, right: 0, bottom: 0, left: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        content: { width: item.width, height: item.height },
        boundingBox: { x: 0, y: 0, top: 0, right: item.width, bottom: item.height, left: 0, width: item.width, height: item.height },
      },
      layoutContext: {
        parentTagName: 'viewport',
        parentSelector: 'body',
        display: 'block',
        position: 'static',
        isFlexChild: false,
        isGridChild: false,
      },
      layoutBugs: { hasHorizontalScrollLeak: false, isClippedByAncestor: false, hasZIndexConflict: false, zIndex: 'auto', warnings: [] },
      computedStyles: {},
      screenshotBase64: item.dataUrl,
      userInstructions: item.caption.trim() || `${item.name} (${item.mode}) captured from LetMe Studio`,
      annotations: [],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      },
    };
    chrome.runtime.sendMessage({ type: 'ELEMENT_CAPTURED', payload: snapshot }, (res) => {
      if (res?.snapshots) {
        this.mcpSnapshots = res.snapshots;
        this.renderStudio();
      }
    });
    this.overlayUi?.showToast(`${item.name} sent to AI via MCP!`);
  }

  private handleCopySingleLayer(layerId: string) {
    const layer = this.layers.find((l) => l.id === layerId);
    if (!layer) return;
    const promptText = [
      `# LetMe Layer ${layer.index} Prompt`,
      `- **Page**: ${document.title}`,
      `- **URL**: ${window.location.href}`,
      '',
      this.formatLayerPromptSection(this.buildLayerDetailSnapshot(layer)),
    ].join('\n');
    navigator.clipboard.writeText(promptText);
    this.copyHistory.unshift({
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      layerCount: 1,
      summary: `Layer ${layer.index} <${layer.tagName}> [${layer.tag.toUpperCase()}]`,
      text: promptText,
    });
    if (this.copyHistory.length > 20) this.copyHistory.pop();
    this.renderStudio();
    this.overlayUi?.showToast(`Layer ${layer.index} prompt copied!`);
  }

  private handleCopyPrompt() {
    if (this.layers.length === 0) {
      this.overlayUi?.showToast('Pick at least 1 element first.', true);
      return;
    }
    const promptText = this.buildStructuredCopyPrompt();
    navigator.clipboard.writeText(promptText);
    const summary = this.layers.map((l) => `#${l.index} <${l.tagName}> [${l.tag.toUpperCase()}]`).join(', ');
    this.copyHistory.unshift({
      id: `copy_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      layerCount: this.layers.length,
      summary,
      text: promptText,
    });
    if (this.copyHistory.length > 20) this.copyHistory.pop();
    this.renderStudio();
    this.overlayUi?.showToast('Structured prompt copied to clipboard!');
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
      const layerDetails = this.layers.map((l) => this.buildLayerDetailSnapshot(l));

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
        sourceContext: layerDetails[0]?.sourceContext,
        semanticAnchors: layerDetails[0]?.semanticAnchors,
        status: 'pending',
        screenshotBase64: annotatedScreenshotBase64,
        userInstructions: instructions || undefined,
        userBugNotes: bugNotes || undefined,
        globalInstructions: this.finalInstructions.trim() || undefined,
        layers: layerDetails,
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
