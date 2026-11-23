import { MarkupAnnotation, MarkupPoint } from '@letme/shared';

export type MarkupTool = 'select' | 'pen' | 'arrow' | 'box' | 'text' | 'ruler' | 'blur';

export class MarkupStudio {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private annotations: MarkupAnnotation[] = [];
  private currentTool: MarkupTool = 'pen';
  private currentColor: string = '#ef4444'; // Red default for bugs
  private currentStrokeWidth: number = 3;
  private isDrawing: boolean = false;
  private startPoint: MarkupPoint | null = null;
  private currentAnnotation: MarkupAnnotation | null = null;

  // Dragging text annotation
  private draggingAnnotation: MarkupAnnotation | null = null;
  private dragOffset: MarkupPoint = { x: 0, y: 0 };

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'letme-markup-canvas';
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.zIndex = '2147483640';
    this.canvas.style.pointerEvents = 'auto';
    this.canvas.style.cursor = 'crosshair';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = ctx;

    this.attachEvents();
  }

  getCanvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  setTool(tool: MarkupTool) {
    this.currentTool = tool;
    if (tool === 'select') {
      this.canvas.style.cursor = 'default';
    } else if (tool === 'text') {
      this.canvas.style.cursor = 'text';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  setColor(color: string) {
    this.currentColor = color;
  }

  setStrokeWidth(width: number) {
    this.currentStrokeWidth = width;
  }

  getAnnotations(): MarkupAnnotation[] {
    return this.annotations;
  }

  undo() {
    this.annotations.pop();
    this.redraw();
  }

  clear() {
    this.annotations = [];
    this.redraw();
  }

  private attachEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
  }

  private getPoint(e: MouseEvent): MarkupPoint {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private findTextAnnotationAt(pt: MarkupPoint): MarkupAnnotation | null {
    // Check backwards to select topmost
    for (let i = this.annotations.length - 1; i >= 0; i--) {
      const ann = this.annotations[i];
      if (ann.type === 'text' && ann.startPoint && ann.text) {
        // Measure text hit box
        const hitX = ann.startPoint.x;
        const hitY = ann.startPoint.y - 14;
        const hitW = ann.text.length * 9 + 30;
        const hitH = 32;

        if (pt.x >= hitX - 10 && pt.x <= hitX + hitW && pt.y >= hitY - 10 && pt.y <= hitY + hitH) {
          return ann;
        }
      }
    }
    return null;
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    const pt = this.getPoint(e);

    // 1. Check if user clicked on an existing text annotation to drag it!
    const textAnn = this.findTextAnnotationAt(pt);
    if (textAnn && (this.currentTool === 'select' || this.currentTool === 'text')) {
      this.draggingAnnotation = textAnn;
      this.dragOffset = {
        x: pt.x - textAnn.startPoint!.x,
        y: pt.y - textAnn.startPoint!.y,
      };
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    // 2. If text tool and clicked on empty space -> Show Inline Modal!
    if (this.currentTool === 'text') {
      this.showInlineTextModal(e.clientX, e.clientY, pt);
      return;
    }

    this.isDrawing = true;
    this.startPoint = pt;
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (this.currentTool === 'pen') {
      this.currentAnnotation = {
        id,
        type: 'pen',
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        points: [pt],
      };
    } else if (this.currentTool === 'arrow') {
      this.currentAnnotation = {
        id,
        type: 'arrow',
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        startPoint: pt,
        endPoint: pt,
      };
    } else if (this.currentTool === 'box') {
      this.currentAnnotation = {
        id,
        type: 'box',
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        startPoint: pt,
        endPoint: pt,
      };
    } else if (this.currentTool === 'ruler') {
      this.currentAnnotation = {
        id,
        type: 'ruler',
        color: '#38bdf8',
        strokeWidth: 2,
        startPoint: pt,
        endPoint: pt,
      };
    } else if (this.currentTool === 'blur') {
      this.currentAnnotation = {
        id,
        type: 'blur',
        startPoint: pt,
        endPoint: pt,
      };
    }
  }

  private showInlineTextModal(clientX: number, clientY: number, canvasPt: MarkupPoint) {
    // Remove existing
    document.getElementById('letme-inline-text-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'letme-inline-text-modal';
    modal.style.position = 'fixed';
    modal.style.left = `${Math.min(window.innerWidth - 260, Math.max(10, clientX))}px`;
    modal.style.top = `${Math.min(window.innerHeight - 100, Math.max(10, clientY - 40))}px`;
    modal.style.backgroundColor = '#09090b';
    modal.style.border = '1px solid #27272a';
    modal.style.borderRadius = '8px';
    modal.style.padding = '8px';
    modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.7)';
    modal.style.zIndex = '2147483647';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.gap = '6px';
    modal.style.width = '240px';

    modal.innerHTML = `
      <div style="font-size: 11px; font-weight: 600; color: #a1a1aa; font-family: system-ui, sans-serif;">Add Text Note:</div>
      <input type="text" id="letme-inline-text-input" placeholder="e.g. Salah ini, Padding terlalu rapat..."
        style="width: 100%; box-sizing: border-box; background: #18181b; border: 1px solid #3f3f46; color: #fafafa; padding: 6px 8px; border-radius: 4px; font-size: 12px; outline: none; font-family: inherit;" />
      <div style="display: flex; justify-content: flex-end; gap: 4px;">
        <button id="letme-btn-cancel-text" style="background: none; border: none; color: #71717a; font-size: 11px; padding: 4px 8px; cursor: pointer;">Cancel</button>
        <button id="letme-btn-add-text" style="background: #fafafa; border: none; color: #09090b; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 4px; cursor: pointer;">Add</button>
      </div>
    `;

    modal.addEventListener('mousedown', (e) => e.stopPropagation());
    modal.addEventListener('mouseup', (e) => e.stopPropagation());
    modal.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(modal);

    const input = modal.querySelector('#letme-inline-text-input') as HTMLInputElement;
    input.focus();

    const confirm = () => {
      const val = input.value.trim();
      if (val) {
        this.annotations.push({
          id: `ann_text_${Date.now()}`,
          type: 'text',
          startPoint: canvasPt,
          text: val,
          color: this.currentColor,
        });
        this.redraw();
      }
      modal.remove();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
      if (e.key === 'Escape') modal.remove();
    });

    modal.querySelector('#letme-btn-add-text')?.addEventListener('click', confirm);
    modal.querySelector('#letme-btn-cancel-text')?.addEventListener('click', () => modal.remove());
  }

  private onMouseMove(e: MouseEvent) {
    const pt = this.getPoint(e);

    // If dragging existing text annotation
    if (this.draggingAnnotation && this.draggingAnnotation.startPoint) {
      this.draggingAnnotation.startPoint.x = pt.x - this.dragOffset.x;
      this.draggingAnnotation.startPoint.y = pt.y - this.dragOffset.y;
      this.redraw();
      return;
    }

    // Hover cursor for text annotations
    if (!this.isDrawing) {
      const textAnn = this.findTextAnnotationAt(pt);
      if (textAnn) {
        this.canvas.style.cursor = 'grab';
      } else if (this.currentTool === 'text') {
        this.canvas.style.cursor = 'text';
      } else if (this.currentTool === 'select') {
        this.canvas.style.cursor = 'default';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
    }

    if (!this.isDrawing || !this.currentAnnotation) return;

    if (this.currentAnnotation.type === 'pen' && this.currentAnnotation.points) {
      this.currentAnnotation.points.push(pt);
    } else {
      this.currentAnnotation.endPoint = pt;
      if (this.currentAnnotation.type === 'ruler' && this.currentAnnotation.startPoint) {
        const dx = pt.x - this.currentAnnotation.startPoint.x;
        const dy = pt.y - this.currentAnnotation.startPoint.y;
        const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
        this.currentAnnotation.text = `${dist}px`;
      }
    }

    this.redraw();
    this.drawAnnotation(this.currentAnnotation);
  }

  private onMouseUp() {
    if (this.draggingAnnotation) {
      this.draggingAnnotation = null;
      this.canvas.style.cursor = 'default';
      this.redraw();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentAnnotation) {
      if (this.currentAnnotation.type === 'blur' && this.currentAnnotation.startPoint && this.currentAnnotation.endPoint) {
        const x = Math.min(this.currentAnnotation.startPoint.x, this.currentAnnotation.endPoint.x);
        const y = Math.min(this.currentAnnotation.startPoint.y, this.currentAnnotation.endPoint.y);
        const width = Math.abs(this.currentAnnotation.endPoint.x - this.currentAnnotation.startPoint.x);
        const height = Math.abs(this.currentAnnotation.endPoint.y - this.currentAnnotation.startPoint.y);
        this.currentAnnotation.blurArea = { x, y, width, height };
      }

      this.annotations.push(this.currentAnnotation);
      this.currentAnnotation = null;
      this.redraw();
    }
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const ann of this.annotations) {
      this.drawAnnotation(ann);
    }
  }

  private drawAnnotation(ann: MarkupAnnotation) {
    const ctx = this.ctx;
    ctx.save();

    if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
      ctx.strokeStyle = ann.color || '#ef4444';
      ctx.lineWidth = ann.strokeWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y);
      }
      ctx.stroke();
    } else if (ann.type === 'arrow' && ann.startPoint && ann.endPoint) {
      this.drawArrow(ann.startPoint, ann.endPoint, ann.color || '#ef4444', ann.strokeWidth || 3);
    } else if (ann.type === 'box' && ann.startPoint && ann.endPoint) {
      const x = Math.min(ann.startPoint.x, ann.endPoint.x);
      const y = Math.min(ann.startPoint.y, ann.endPoint.y);
      const w = Math.abs(ann.endPoint.x - ann.startPoint.x);
      const h = Math.abs(ann.endPoint.y - ann.startPoint.y);

      ctx.strokeStyle = ann.color || '#ef4444';
      ctx.lineWidth = ann.strokeWidth || 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, w, h);

      ctx.setLineDash([]);
      ctx.fillStyle = ann.color || '#ef4444';
      ctx.fillRect(x, Math.max(0, y - 22), 52, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('BUG', x + 10, Math.max(0, y - 22) + 15);
    } else if (ann.type === 'ruler' && ann.startPoint && ann.endPoint) {
      this.drawRuler(ann.startPoint, ann.endPoint, ann.text || '');
    } else if (ann.type === 'text' && ann.startPoint && ann.text) {
      // Draggable text badge
      ctx.fillStyle = ann.color || '#ef4444';
      ctx.beginPath();
      ctx.arc(ann.startPoint.x, ann.startPoint.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '13px system-ui, sans-serif';
      const textMetrics = ctx.measureText(ann.text);
      const boxW = textMetrics.width + 20;
      const boxH = 26;
      const boxX = ann.startPoint.x + 12;
      const boxY = ann.startPoint.y - 13;

      // Dark card
      ctx.fillStyle = 'rgba(9, 9, 11, 0.95)';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fafafa';
      ctx.fillText(ann.text, boxX + 10, boxY + 17);
    } else if (ann.type === 'blur' && ann.startPoint && ann.endPoint) {
      const x = Math.min(ann.startPoint.x, ann.endPoint.x);
      const y = Math.min(ann.startPoint.y, ann.endPoint.y);
      const w = Math.abs(ann.endPoint.x - ann.startPoint.x);
      const h = Math.abs(ann.endPoint.y - ann.startPoint.y);

      ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#71717a';
      ctx.font = 'italic 11px sans-serif';
      ctx.fillText('[CENSORED]', x + 6, y + h / 2 + 4);
    }

    ctx.restore();
  }

  private drawArrow(from: MarkupPoint, to: MarkupPoint, color: string, strokeWidth: number) {
    const ctx = this.ctx;
    const headlen = 16;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  private drawRuler(from: MarkupPoint, to: MarkupPoint, text: string) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const tickLen = 8;
    const drawTick = (pt: MarkupPoint) => {
      ctx.beginPath();
      ctx.moveTo(pt.x + tickLen * Math.cos(angle + Math.PI / 2), pt.y + tickLen * Math.sin(angle + Math.PI / 2));
      ctx.lineTo(pt.x - tickLen * Math.cos(angle + Math.PI / 2), pt.y - tickLen * Math.sin(angle + Math.PI / 2));
      ctx.stroke();
    };
    drawTick(from);
    drawTick(to);

    if (text) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.font = 'bold 12px monospace';
      const m = ctx.measureText(text);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(midX - m.width / 2 - 6, midY - 12, m.width + 12, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, midX - m.width / 2, midY + 4);
    }
  }

  async exportAnnotatedScreenshot(baseScreenshotUrl: string, elementBoundingBox?: { x: number; y: number; width: number; height: number }): Promise<string> {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.canvas.width;
    offscreen.height = this.canvas.height;
    const oCtx = offscreen.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = baseScreenshotUrl;
    });

    oCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
    oCtx.drawImage(this.canvas, 0, 0);

    if (elementBoundingBox && elementBoundingBox.width > 0 && elementBoundingBox.height > 0) {
      const pad = 40;
      const cropX = Math.max(0, elementBoundingBox.x - pad);
      const cropY = Math.max(0, elementBoundingBox.y - pad);
      const cropW = Math.min(offscreen.width - cropX, elementBoundingBox.width + pad * 2);
      const cropH = Math.min(offscreen.height - cropY, elementBoundingBox.height + pad * 2);

      const cropped = document.createElement('canvas');
      cropped.width = cropW;
      cropped.height = cropH;
      const cCtx = cropped.getContext('2d')!;
      cCtx.drawImage(offscreen, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      return cropped.toDataURL('image/png');
    }

    return offscreen.toDataURL('image/png');
  }

  destroy() {
    this.canvas.remove();
    document.getElementById('letme-inline-text-modal')?.remove();
  }
}
