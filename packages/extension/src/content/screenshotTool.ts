import { getLucideSvg } from '../icons.js';

export class ScreenshotTool {
  private overlay: HTMLDivElement | null = null;
  private selectionBox: HTMLDivElement | null = null;
  private isSelecting: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private areaResolver: ((rect: DOMRect | null) => void) | null = null;

  selectAreaOnly(): Promise<DOMRect | null> {
    return new Promise((resolve) => {
      this.areaResolver = resolve;
      this.startAreaCapture();
    });
  }

  startAreaCapture() {
    this.cleanup();

    this.overlay = document.createElement('div');
    this.overlay.id = 'letme-screenshot-overlay';
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100vw';
    this.overlay.style.height = '100vh';
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    this.overlay.style.zIndex = '2147483646';
    this.overlay.style.cursor = 'crosshair';
    this.overlay.style.userSelect = 'none';

    // Dimension guide
    this.selectionBox = document.createElement('div');
    this.selectionBox.style.position = 'fixed';
    this.selectionBox.style.border = '2px dashed #ffffff';
    this.selectionBox.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    this.selectionBox.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.45)';
    this.selectionBox.style.display = 'none';
    this.selectionBox.style.pointerEvents = 'none';
    this.selectionBox.style.zIndex = '2147483647';

    // Tooltip indicator
    const tip = document.createElement('div');
    tip.id = 'letme-crop-tip';
    tip.style.position = 'fixed';
    tip.style.top = '20px';
    tip.style.left = '50%';
    tip.style.transform = 'translateX(-50%)';
    tip.style.backgroundColor = '#09090b';
    tip.style.border = '1px solid #27272a';
    tip.style.color = '#fafafa';
    tip.style.padding = '8px 16px';
    tip.style.borderRadius = '9999px';
    tip.style.fontSize = '12px';
    tip.style.fontFamily = 'monospace';
    tip.style.fontWeight = '600';
    tip.innerText = 'Drag to select screenshot area (ESC to cancel)';
    this.overlay.appendChild(tip);

    document.body.appendChild(this.selectionBox);
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.isSelecting = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = e.clientX;
    this.currentY = e.clientY;

    if (this.selectionBox) {
      this.selectionBox.style.display = 'block';
      this.updateSelectionBox();
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isSelecting) return;
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.updateSelectionBox();
  };

  private updateSelectionBox() {
    if (!this.selectionBox) return;
    const x = Math.min(this.startX, this.currentX);
    const y = Math.min(this.startY, this.currentY);
    const w = Math.abs(this.currentX - this.startX);
    const h = Math.abs(this.currentY - this.startY);

    this.selectionBox.style.left = `${x}px`;
    this.selectionBox.style.top = `${y}px`;
    this.selectionBox.style.width = `${w}px`;
    this.selectionBox.style.height = `${h}px`;
  }

  private onMouseUp = async () => {
    if (!this.isSelecting) return;
    this.isSelecting = false;

    const x = Math.min(this.startX, this.currentX);
    const y = Math.min(this.startY, this.currentY);
    const w = Math.abs(this.currentX - this.startX);
    const h = Math.abs(this.currentY - this.startY);

    this.cleanup();

    if (this.areaResolver) {
      const resolve = this.areaResolver;
      this.areaResolver = null;
      resolve(w >= 10 && h >= 10 ? new DOMRect(x, y, w, h) : null);
      return;
    }

    if (w < 10 || h < 10) return; // Ignore accidental clicks

    await this.captureAndProcessCrop(x, y, w, h);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.cleanup();
      if (this.areaResolver) {
        const resolve = this.areaResolver;
        this.areaResolver = null;
        resolve(null);
      }
    }
  };

  async captureFullPage() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const dataUrl: string = response?.dataUrl || '';
      if (!dataUrl) throw new Error('Could not capture viewport screenshot.');

      await this.showScreenshotResultDialog(dataUrl, 'full-viewport.png');
    } catch (err: any) {
      alert(`Screenshot failed: ${err.message}`);
    }
  }

  private async captureAndProcessCrop(x: number, y: number, w: number, h: number) {
    try {
      // Hide cursor/overlays before capturing
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const rawDataUrl: string = response?.dataUrl || '';
      if (!rawDataUrl) throw new Error('Could not capture tab.');

      // Crop image via Canvas
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = rawDataUrl;
      });

      const dpr = window.devicePixelRatio || 1;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.round(w * dpr);
      cropCanvas.height = Math.round(h * dpr);
      const ctx = cropCanvas.getContext('2d')!;

      ctx.drawImage(
        img,
        Math.round(x * dpr),
        Math.round(y * dpr),
        Math.round(w * dpr),
        Math.round(h * dpr),
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );

      const croppedDataUrl = cropCanvas.toDataURL('image/png');

      // Auto copy image to clipboard
      cropCanvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          } catch (clipErr) {
            console.warn('[LetMe] Clipboard write image error:', clipErr);
          }
        }
      }, 'image/png');

      await this.showScreenshotResultDialog(croppedDataUrl, `screenshot-${Math.round(w)}x${Math.round(h)}.png`);
    } catch (err: any) {
      alert(`Area crop error: ${err.message}`);
    }
  }

  private async showScreenshotResultDialog(dataUrl: string, filename: string) {
    const dialog = document.createElement('div');
    dialog.id = 'letme-screenshot-modal';
    dialog.style.position = 'fixed';
    dialog.style.bottom = '24px';
    dialog.style.right = '24px';
    dialog.style.maxWidth = '420px';
    dialog.style.backgroundColor = '#09090b';
    dialog.style.border = '1px solid #27272a';
    dialog.style.borderRadius = '12px';
    dialog.style.padding = '16px';
    dialog.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7)';
    dialog.style.zIndex = '2147483647';
    dialog.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    dialog.style.color = '#fafafa';

    dialog.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 700; font-size: 13px; color: #ffffff;">Screenshot Captured</span>
          <span style="font-size: 11px; padding: 2px 6px; background: #27272a; border-radius: 4px; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
            ${getLucideSvg('check', { size: 11, color: '#10b981' })} Copied to Clipboard
          </span>
        </div>
        <button id="letme-btn-close-modal" style="background: none; border: none; color: #a1a1aa; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 2px 4px; border-radius: 4px;">${getLucideSvg('x', { size: 14 })}</button>
      </div>

      <div style="border: 1px solid #27272a; border-radius: 6px; overflow: hidden; margin-bottom: 12px; background: #18181b; max-height: 180px; display: flex; align-items: center; justify-content: center;">
        <img src="${dataUrl}" style="max-width: 100%; max-height: 180px; object-fit: contain; display: block;" />
      </div>

      <div style="display: flex; gap: 8px;">
        <button id="letme-btn-download" style="flex: 1; padding: 8px 12px; background: #18181b; border: 1px solid #27272a; color: #fafafa; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${getLucideSvg('download', { size: 13 })} Download PNG
        </button>
        <button id="letme-btn-send-mcp" style="flex: 1; padding: 8px 12px; background: #fafafa; border: 1px solid #ffffff; color: #09090b; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${getLucideSvg('zap', { size: 13, color: '#09090b' })} Send to MCP
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    dialog.querySelector('#letme-btn-close-modal')?.addEventListener('click', () => dialog.remove());

    dialog.querySelector('#letme-btn-download')?.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
    });

    dialog.querySelector('#letme-btn-send-mcp')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'ELEMENT_CAPTURED',
        payload: {
          id: `shot_${Date.now()}`,
          timestamp: Date.now(),
          url: window.location.href,
          pageTitle: document.title,
          selector: 'viewport',
          tagName: 'screenshot',
          classNames: [],
          outerHtmlSnippet: '<!-- Viewport Screenshot Area -->',
          boxModel: {
            width: window.innerWidth,
            height: window.innerHeight,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            border: { top: 0, right: 0, bottom: 0, left: 0 },
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            content: { width: window.innerWidth, height: window.innerHeight },
            boundingBox: { x: 0, y: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0, width: window.innerWidth, height: window.innerHeight },
          },
          layoutContext: {
            parentTagName: 'body',
            parentSelector: 'body',
            display: 'block',
            position: 'static',
            isFlexChild: false,
            isGridChild: false,
          },
          layoutBugs: {
            hasHorizontalScrollLeak: false,
            isClippedByAncestor: false,
            hasZIndexConflict: false,
            zIndex: 'auto',
            warnings: [],
          },
          computedStyles: {},
          screenshotBase64: dataUrl,
          userInstructions: 'Analisis visual dari screenshot yang ditangkap pengguna',
          annotations: [],
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
          },
        },
      });

      const btn = dialog.querySelector('#letme-btn-send-mcp') as HTMLButtonElement;
      if (btn) {
        btn.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${getLucideSvg('check', { size: 12, color: '#09090b' })} Sent to AI via MCP!</span>`;
        btn.disabled = true;
      }
      setTimeout(() => dialog.remove(), 2000);
    });
  }

  private cleanup() {
    this.overlay?.remove();
    this.selectionBox?.remove();
    this.overlay = null;
    this.selectionBox = null;
    this.isSelecting = false;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

export const screenshotTool = new ScreenshotTool();
