import { MarkupAnnotation } from '@letme/shared';
import { getLucideSvg } from '../icons.js';
import { MarkupStudio, MarkupTool } from './markupStudio.js';

export interface ScreenshotLayerItem {
  id: string;
  index: number;
  name: string;
  mode: string;
  dataUrl: string;
  originalDataUrl: string;
  width: number;
  height: number;
  timestamp: number;
  caption: string;
  frame: 'none' | 'blueprint';
  annotations?: MarkupAnnotation[];
}

export interface ScrEditorCallbacks {
  onSave: (
    itemId: string,
    updatedDataUrl: string,
    caption: string,
    frame: 'none' | 'blueprint',
    annotations: MarkupAnnotation[],
  ) => void;
  onCopyImage: (
    dataUrl: string,
    caption: string,
    frame: 'none' | 'blueprint',
    annotations: MarkupAnnotation[],
  ) => void;
  onDownload: (dataUrl: string, filename: string) => void;
  onSendToAi: (
    item: ScreenshotLayerItem,
    updatedDataUrl: string,
    caption: string,
    annotations: MarkupAnnotation[],
  ) => void;
}

export class ScrEditorModal {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private baseImg: HTMLImageElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private markup: MarkupStudio | null = null;
  private activeTool: MarkupTool = 'pen';
  private activeColor: string = '#ef4444';
  private activeStroke: number = 3;
  private frameMode: 'none' | 'blueprint' = 'none';
  private zoomMode: 'fit' | 'actual' = 'fit';
  private rightRailOpen: boolean = true;
  private includeCaptionInImage: boolean = true;
  private isSpacePanning: boolean = false;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

  open(item: ScreenshotLayerItem, callbacks: ScrEditorCallbacks) {
    this.close();
    this.frameMode = item.frame;
    this.zoomMode = 'fit';
    this.rightRailOpen = true;
    this.includeCaptionInImage = true;
    this.activeTool = 'pen';

    this.host = document.createElement('div');
    this.host.id = 'letme-scr-editor-root';
    this.shadow = this.host.attachShadow({ mode: 'open' });
    document.body.appendChild(this.host);

    const swatches = ['#ef4444', '#ffffff', '#22c55e', '#3b82f6'];

    this.shadow.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .backdrop {
          position: fixed; inset: 0; z-index: 2147483647;
          background: #050505; display: flex;
        }
        .modal {
          width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh;
          background: #08080a; display: flex; flex-direction: column; overflow: hidden; color: #fafafa;
        }
        .head {
          height: 48px; flex-shrink: 0; padding: 0 14px;
          background: #050505; border-bottom: 1px solid #27272a;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .head-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .brand-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffffff; flex-shrink: 0; }
        .title {
          font-size: 12px; font-weight: 700; color: #ffffff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .meta-pill {
          font-size: 10px; font-weight: 600; color: #a1a1aa;
          padding: 2px 7px; border-radius: 999px; border: 1px solid #27272a; background: #0a0a0c;
        }
        .head-center { display: flex; align-items: center; gap: 6px; }
        .head-right { display: flex; align-items: center; gap: 6px; }
        .workspace { flex: 1; min-height: 0; display: flex; overflow: hidden; }
        .tool-dock {
          width: 62px; flex-shrink: 0; padding: 8px 4px;
          background: #050505; border-right: 1px solid #27272a;
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .tool-dock::-webkit-scrollbar,
        .stage::-webkit-scrollbar,
        .right-rail::-webkit-scrollbar {
          display: none; width: 0; height: 0;
        }
        .dock-btn {
          width: 48px; padding: 4px 2px; border-radius: 7px;
          border: 1px solid transparent; background: transparent;
          color: #a1a1aa; font-size: 9px; font-weight: 600; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 2px;
          transition: all 0.12s ease; flex-shrink: 0;
        }
        .dock-btn:hover { background: #141418; color: #ffffff; border-color: #2e2e32; }
        .dock-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
        .dock-sep { width: 34px; height: 1px; background: #27272a; margin: 3px 0; flex-shrink: 0; }
        .swatch-grid { display: grid; grid-template-columns: repeat(2, 16px); gap: 4px; }
        .swatch {
          width: 16px; height: 16px; border-radius: 50%; border: 1px solid #3f3f46;
          cursor: pointer; padding: 0;
        }
        .swatch.active { outline: 2px solid #ffffff; outline-offset: 1px; }
        .t-btn {
          padding: 6px 10px; border-radius: 6px; border: 1px solid #2e2e32; background: #0a0a0c;
          color: #d4d4d8; font-size: 11px; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .t-btn:hover { border-color: #ffffff; color: #ffffff; }
        .t-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
        .stage {
          flex: 1; min-width: 0; min-height: 0; overflow: auto; padding: 24px;
          display: flex; align-items: center; justify-content: center;
          background-color: #070709;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 16px 16px;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .stage.panning, .stage.panning * { cursor: grab !important; }
        .stage.panning.dragging, .stage.panning.dragging * { cursor: grabbing !important; }
        .stage.actual { align-items: flex-start; justify-content: flex-start; }
        .canvas-wrap { position: relative; display: inline-block; line-height: 0; }
        canvas#ed-canvas {
          border-radius: 6px; border: 1px solid #3f3f46; display: block;
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.7);
        }
        .stage.fit canvas#ed-canvas {
          max-width: 100%; max-height: calc(100vh - 96px); width: auto; height: auto;
        }
        .stage.actual canvas#ed-canvas { max-width: none; max-height: none; }
        .right-rail {
          width: 280px; flex-shrink: 0; padding: 14px;
          background: #050505; border-left: 1px solid #27272a;
          display: flex; flex-direction: column; gap: 16px;
          overflow-y: auto; overflow-x: hidden;
          scrollbar-width: none; -ms-overflow-style: none;
        }
        .right-rail.hidden { display: none; }
        .rail-sec { display: flex; flex-direction: column; gap: 8px; }
        .rail-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #71717a;
        }
        .seg-group { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .caption-area {
          width: 100%; min-height: 140px; resize: vertical;
          background: #0a0a0c; border: 1px solid #2e2e32; border-radius: 7px;
          color: #fafafa; padding: 9px 10px; font-size: 12px; line-height: 1.45; outline: none;
        }
        .caption-area:focus { border-color: #ffffff; }
        .hint-box {
          margin-top: auto; padding: 10px; border-radius: 7px;
          border: 1px dashed #27272a; background: #0a0a0c;
          font-size: 10px; color: #71717a; line-height: 1.6;
        }
        .kbd {
          padding: 1px 5px; border-radius: 4px; border: 1px solid #3f3f46;
          background: #141418; color: #e4e4e7; font-size: 9px; font-weight: 600;
        }
        .btn-pri {
          padding: 6px 12px; background: #ffffff; border: 1px solid #ffffff; border-radius: 6px;
          color: #000000; font-size: 11px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .btn-pri:hover { background: #e4e4e7; }
      </style>
      <div class="backdrop">
        <div class="modal">
          <div class="head">
            <div class="head-left">
              <span class="brand-dot"></span>
              <span class="title">Edit ${item.name}</span>
              <span class="meta-pill">${item.width}×${item.height}px</span>
            </div>
            <div class="head-center">
              <button id="ed-undo" class="t-btn" title="Undo (Ctrl+Z)">${getLucideSvg('undo-2', { size: 12 })} Undo</button>
              <button id="ed-redo" class="t-btn" title="Redo (Ctrl+Y)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg> Redo</button>
              <button id="ed-clear" class="t-btn" title="Clear Markups">${getLucideSvg('trash-2', { size: 12 })} Clear</button>
              <button id="ed-zoom" class="t-btn" title="Toggle Fit / 100%">Zoom: Fit</button>
              <button id="ed-toggle-rail" class="t-btn active" title="Toggle Notes & Frame Panel">Inspector</button>
            </div>
            <div class="head-right">
              <button id="ed-copy" class="t-btn">${getLucideSvg('copy', { size: 12 })} Copy</button>
              <button id="ed-download" class="t-btn">${getLucideSvg('download', { size: 12 })} Save File</button>
              <button id="ed-send" class="t-btn">${getLucideSvg('zap', { size: 12 })} Send MCP</button>
              <button id="ed-save" class="btn-pri">Save Changes</button>
              <button id="ed-close" class="t-btn" title="Close (Esc)">×</button>
            </div>
          </div>
          <div class="workspace">
            <div class="tool-dock">
              <button class="dock-btn" data-ed-tool="select"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg><span>Move</span></button>
              <button class="dock-btn active" data-ed-tool="pen">${getLucideSvg('pencil', { size: 15 })}<span>Draw</span></button>
              <button class="dock-btn" data-ed-tool="arrow">${getLucideSvg('arrow-right', { size: 15 })}<span>Arrow</span></button>
              <button class="dock-btn" data-ed-tool="line">${getLucideSvg('minus', { size: 15 })}<span>Line</span></button>
              <button class="dock-btn" data-ed-tool="ruler">${getLucideSvg('ruler', { size: 15 })}<span>Ruler</span></button>
              <button class="dock-btn" data-ed-tool="box">${getLucideSvg('square', { size: 15 })}<span>Box</span></button>
              <button class="dock-btn" data-ed-tool="circle"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg><span>Circle</span></button>
              <button class="dock-btn" data-ed-tool="text">${getLucideSvg('type', { size: 15 })}<span>Text</span></button>
              <button class="dock-btn" data-ed-tool="sticky"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg><span>Note</span></button>
              <button class="dock-btn" data-ed-tool="blur">${getLucideSvg('eye-off', { size: 15 })}<span>Censor</span></button>
              <button class="dock-btn" data-ed-tool="eraser"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg><span>Eraser</span></button>
              <div class="dock-sep"></div>
              <input id="ed-color" type="color" value="${this.activeColor}" style="width:28px;height:28px;border:1px solid #3f3f46;background:none;cursor:pointer;border-radius:50%;" title="Custom Color" />
              <div class="swatch-grid">
                ${swatches
                  .map(
                    (c) =>
                      `<button class="swatch ${c === this.activeColor ? 'active' : ''}" data-ed-swatch="${c}" style="background:${c};" title="${c}"></button>`,
                  )
                  .join('')}
              </div>
              <button id="ed-px" class="dock-btn" style="margin-top:4px;border:1px solid #2e2e32;"><span>${this.activeStroke}px</span></button>
            </div>
            <div id="ed-stage" class="stage fit">
              <div id="ed-canvas-wrap" class="canvas-wrap">
                <canvas id="ed-canvas"></canvas>
              </div>
            </div>
            <div id="ed-rail" class="right-rail">
              <div class="rail-sec">
                <div class="rail-label">Export Frame</div>
                <div class="seg-group">
                  <button id="ed-frame-none" class="t-btn ${this.frameMode === 'none' ? 'active' : ''}" style="justify-content:center;">None</button>
                  <button id="ed-frame-bp" class="t-btn ${this.frameMode === 'blueprint' ? 'active' : ''}" style="justify-content:center;">Blueprint</button>
                </div>
              </div>
              <div class="rail-sec" style="flex:1;">
                <div class="rail-label">Caption / AI Instructions</div>
                <textarea id="ed-caption" class="caption-area" placeholder="Tambahkan catatan, konteks bug, atau instruksi perbaikan untuk screenshot ini...">${item.caption.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                <button id="ed-caption-burn" class="t-btn active" style="justify-content:center;font-size:10px;" title="Sertakan teks caption di bagian bawah gambar saat Copy / Export">Include Caption in Image: ON</button>
              </div>
              <div class="hint-box">
                <div><span class="kbd">Space + Drag</span> Geser kanvas</div>
                <div><span class="kbd">Ctrl/⌘ + Z</span> Undo coretan terakhir</div>
                <div><span class="kbd">Ctrl/⌘ + Y</span> Redo coretan</div>
                <div><span class="kbd">Esc</span> Tutup editor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.shadow.getElementById('ed-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');
    const canvasWrap = this.shadow.getElementById('ed-canvas-wrap') as HTMLElement | null;

    const img = new Image();
    img.onload = () => {
      this.baseImg = img;
      if (this.canvas && this.ctx && canvasWrap) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        this.markup = new MarkupStudio(img.width, img.height, {
          mode: 'contained',
          container: canvasWrap,
        });
        this.markup.setTool(this.activeTool);
        this.markup.setColor(this.activeColor);
        this.markup.setStrokeWidth(this.activeStroke);
        if (item.annotations?.length) {
          this.markup.setAnnotations(item.annotations);
        }
      }
    };
    img.src = item.originalDataUrl;

    this.bindEditorEvents(item, callbacks);
  }

  private bindEditorEvents(item: ScreenshotLayerItem, callbacks: ScrEditorCallbacks) {
    if (!this.shadow) return;

    this.shadow.getElementById('ed-close')?.addEventListener('click', () => this.close());
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-ed-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTool = btn.dataset.edTool as MarkupTool;
        this.markup?.setTool(this.activeTool);
        this.shadow?.querySelectorAll('[data-ed-tool]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const burnBtn = this.shadow.getElementById('ed-caption-burn');
    burnBtn?.addEventListener('click', () => {
      this.includeCaptionInImage = !this.includeCaptionInImage;
      burnBtn.classList.toggle('active', this.includeCaptionInImage);
      burnBtn.textContent = `Include Caption in Image: ${this.includeCaptionInImage ? 'ON' : 'OFF'}`;
    });

    const colorInput = this.shadow.getElementById('ed-color') as HTMLInputElement | null;
    const syncSwatches = (val: string) => {
      this.shadow?.querySelectorAll<HTMLButtonElement>('[data-ed-swatch]').forEach((sw) => {
        sw.classList.toggle('active', sw.dataset.edSwatch?.toLowerCase() === val.toLowerCase());
      });
    };
    colorInput?.addEventListener('input', () => {
      this.activeColor = colorInput.value;
      this.markup?.setColor(this.activeColor);
      syncSwatches(this.activeColor);
    });
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-ed-swatch]').forEach((sw) => {
      sw.addEventListener('click', () => {
        const col = sw.dataset.edSwatch || '#ef4444';
        this.activeColor = col;
        this.markup?.setColor(col);
        if (colorInput) colorInput.value = col;
        syncSwatches(col);
      });
    });

    const pxBtn = this.shadow.getElementById('ed-px');
    pxBtn?.addEventListener('click', () => {
      this.activeStroke = this.activeStroke >= 8 ? 2 : this.activeStroke + 2;
      this.markup?.setStrokeWidth(this.activeStroke);
      pxBtn.innerHTML = `<span>${this.activeStroke}px</span>`;
    });

    const frameNoneBtn = this.shadow.getElementById('ed-frame-none');
    const frameBpBtn = this.shadow.getElementById('ed-frame-bp');
    const setFrameMode = (mode: 'none' | 'blueprint') => {
      this.frameMode = mode;
      frameNoneBtn?.classList.toggle('active', mode === 'none');
      frameBpBtn?.classList.toggle('active', mode === 'blueprint');
    };
    frameNoneBtn?.addEventListener('click', () => setFrameMode('none'));
    frameBpBtn?.addEventListener('click', () => setFrameMode('blueprint'));

    const stageEl = this.shadow.getElementById('ed-stage');
    const zoomBtn = this.shadow.getElementById('ed-zoom');
    zoomBtn?.addEventListener('click', () => {
      this.zoomMode = this.zoomMode === 'fit' ? 'actual' : 'fit';
      stageEl?.classList.toggle('fit', this.zoomMode === 'fit');
      stageEl?.classList.toggle('actual', this.zoomMode === 'actual');
      zoomBtn.textContent = this.zoomMode === 'fit' ? 'Zoom: Fit' : 'Zoom: 100%';
    });

    const railEl = this.shadow.getElementById('ed-rail');
    const toggleRailBtn = this.shadow.getElementById('ed-toggle-rail');
    toggleRailBtn?.addEventListener('click', () => {
      this.rightRailOpen = !this.rightRailOpen;
      railEl?.classList.toggle('hidden', !this.rightRailOpen);
      toggleRailBtn.classList.toggle('active', this.rightRailOpen);
    });

    this.shadow.getElementById('ed-undo')?.addEventListener('click', () => this.markup?.undo());
    this.shadow.getElementById('ed-redo')?.addEventListener('click', () => this.markup?.redo());
    this.shadow.getElementById('ed-clear')?.addEventListener('click', () => this.markup?.clear());

    this.keydownHandler = (e: KeyboardEvent) => {
      if (document.getElementById('letme-inline-text-input')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        return;
      }
      const activeEl = this.shadow?.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT');
      if (isTyping) return;
      if (e.code === 'Space' && !this.isSpacePanning) {
        e.preventDefault();
        this.isSpacePanning = true;
        stageEl?.classList.add('panning');
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.markup?.redo();
        else this.markup?.undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.markup?.redo();
      }
    };
    this.keyupHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && this.isSpacePanning) {
        this.isSpacePanning = false;
        stageEl?.classList.remove('panning', 'dragging');
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);

    // Space+Drag or Middle-Mouse Drag panning on stage (4-way scroll without visible scrollbars)
    stageEl?.addEventListener(
      'mousedown',
      (e) => {
        if (!this.isSpacePanning && e.button !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        stageEl.classList.add('panning', 'dragging');
        const startX = e.clientX;
        const startY = e.clientY;
        const origLeft = stageEl.scrollLeft;
        const origTop = stageEl.scrollTop;

        const onMove = (me: MouseEvent) => {
          stageEl.scrollLeft = origLeft - (me.clientX - startX);
          stageEl.scrollTop = origTop - (me.clientY - startY);
        };
        const onUp = () => {
          stageEl.classList.remove('dragging');
          if (!this.isSpacePanning) stageEl.classList.remove('panning');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      },
      true,
    );

    const exportFinal = () => this.renderExportDataUrl();
    const getCaption = () => (this.shadow?.getElementById('ed-caption') as HTMLTextAreaElement | null)?.value || '';
    const getAnnotations = () => this.markup?.getAnnotations() || [];

    this.shadow.getElementById('ed-copy')?.addEventListener('click', () => {
      callbacks.onCopyImage(exportFinal(), getCaption(), this.frameMode, getAnnotations());
    });
    this.shadow.getElementById('ed-download')?.addEventListener('click', () => {
      callbacks.onDownload(exportFinal(), `${item.name.toLowerCase().replace(/\s+/g, '-')}.png`);
    });
    this.shadow.getElementById('ed-send')?.addEventListener('click', () => {
      callbacks.onSendToAi(item, exportFinal(), getCaption(), getAnnotations());
      this.close();
    });
    this.shadow.getElementById('ed-save')?.addEventListener('click', () => {
      callbacks.onSave(item.id, exportFinal(), getCaption(), this.frameMode, getAnnotations());
      this.close();
    });
  }

  private renderExportDataUrl(): string {
    if (!this.canvas) return '';
    const pad = this.frameMode === 'blueprint' ? 24 : 0;
    const caption = ((this.shadow?.getElementById('ed-caption') as HTMLTextAreaElement | null)?.value || '').trim();
    const shouldBurnCaption = this.includeCaptionInImage && caption.length > 0;
    const baseW = this.canvas.width + pad * 2;
    const baseH = this.canvas.height + pad * 2;

    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d')!;
    const capFontSize = Math.max(14, Math.round(baseW * 0.014));
    const capLineH = Math.round(capFontSize * 1.45);
    const capPadX = Math.max(16, pad || 18);
    const capPadY = 12;
    const wrappedLines: string[] = [];

    if (shouldBurnCaption) {
      mctx.font = `600 ${capFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const maxTextW = Math.max(120, baseW - capPadX * 2);
      for (const para of caption.split('\n')) {
        const words = para.split(' ');
        let line = '';
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (mctx.measureText(test).width > maxTextW && line) {
            wrappedLines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) wrappedLines.push(line);
      }
    }

    const footerH = wrappedLines.length > 0 ? wrappedLines.length * capLineH + capPadY * 2 : 0;
    const out = document.createElement('canvas');
    out.width = baseW;
    out.height = baseH + footerH;
    const octx = out.getContext('2d')!;

    if (this.frameMode === 'blueprint') {
      octx.fillStyle = '#050505';
      octx.fillRect(0, 0, out.width, out.height);
      octx.strokeStyle = '#3f3f46';
      octx.lineWidth = 2;
      octx.strokeRect(pad - 2, pad - 2, this.canvas.width + 4, this.canvas.height + 4);
    } else if (footerH > 0) {
      octx.fillStyle = '#09090b';
      octx.fillRect(0, baseH, out.width, footerH);
    }

    octx.drawImage(this.canvas, pad, pad);
    this.markup?.renderToContext(octx, pad, pad);

    if (footerH > 0) {
      octx.strokeStyle = '#27272a';
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(0, baseH);
      octx.lineTo(out.width, baseH);
      octx.stroke();

      octx.font = `600 ${capFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      octx.fillStyle = '#fafafa';
      octx.textBaseline = 'top';
      wrappedLines.forEach((line, idx) => {
        octx.fillText(line, capPadX, baseH + capPadY + idx * capLineH);
      });
    }
    return out.toDataURL('image/png');
  }

  close() {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    this.isSpacePanning = false;
    this.markup?.destroy();
    this.markup = null;
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.canvas = null;
    this.ctx = null;
  }
}
