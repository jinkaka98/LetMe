import { MarkupAnnotation, MarkupPoint } from '@letme/shared';

export type MarkupTool =
  | 'select'
  | 'eraser'
  | 'pen'
  | 'arrow'
  | 'box'
  | 'rounded-box'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'callout'
  | 'line'
  | 'text'
  | 'ruler'
  | 'blur';

type TransformHandle = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l' | 'rotate';

const SHAPE_TOOLS = new Set<MarkupTool>([
  'box',
  'rounded-box',
  'circle',
  'diamond',
  'triangle',
  'callout',
]);

export class MarkupStudio {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private annotations: MarkupAnnotation[] = [];
  private undoStack: MarkupAnnotation[][] = [];
  private redoStack: MarkupAnnotation[][] = [];
  private currentTool: MarkupTool = 'pen';
  private currentColor: string = '#ffffff';
  private currentStrokeWidth: number = 2;
  private currentFontFamily: string = 'Arial, Helvetica, sans-serif';
  private isDrawing: boolean = false;
  private currentAnnotation: MarkupAnnotation | null = null;
  private onChangeCallback: ((annotations: MarkupAnnotation[]) => void) | null = null;

  // Hand / Transform state (8 handles + rotate + move)
  private selectedId: string | null = null;
  private activeHandle: TransformHandle | 'move' | null = null;
  private lastDragPt: MarkupPoint = { x: 0, y: 0 };
  private initialBBox: { x: number; y: number; w: number; h: number } | null = null;
  private initialAnnotationSnapshot: MarkupAnnotation | null = null;

  // Eraser hover state
  private hoveredEraseId: string | null = null;

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

  setOnChange(cb: (annotations: MarkupAnnotation[]) => void) {
    this.onChangeCallback = cb;
  }

  private emitChange() {
    this.onChangeCallback?.([...this.annotations]);
  }

  private cloneAnnotation(a: MarkupAnnotation): MarkupAnnotation {
    return {
      ...a,
      points: a.points ? a.points.map((p) => ({ ...p })) : undefined,
      startPoint: a.startPoint ? { ...a.startPoint } : undefined,
      endPoint: a.endPoint ? { ...a.endPoint } : undefined,
      blurArea: a.blurArea ? { ...a.blurArea } : undefined,
    };
  }

  private pushHistory() {
    this.undoStack.push(this.annotations.map((a) => this.cloneAnnotation(a)));
    if (this.undoStack.length > 40) this.undoStack.shift();
    this.redoStack = [];
  }

  setAnnotations(list: MarkupAnnotation[]) {
    this.annotations = list.map((a) => this.cloneAnnotation(a));
    this.undoStack = [];
    this.redoStack = [];
    this.selectedId = null;
    this.hoveredEraseId = null;
    this.redraw();
  }

  setTool(tool: MarkupTool) {
    this.currentTool = tool;
    this.hoveredEraseId = null;
    if (tool !== 'select') {
      this.selectedId = null;
    }
    if (tool === 'select') {
      this.canvas.style.cursor = 'default';
    } else if (tool === 'eraser') {
      this.canvas.style.cursor = 'pointer';
    } else if (tool === 'text') {
      this.canvas.style.cursor = 'text';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
    this.redraw();
  }

  setColor(color: string) {
    this.currentColor = color;
  }

  setStrokeWidth(width: number) {
    this.currentStrokeWidth = Math.max(1, Math.min(24, width));
  }

  setFontFamily(font: string) {
    this.currentFontFamily = font;
  }

  getAnnotations(): MarkupAnnotation[] {
    return this.annotations;
  }

  undo() {
    if (this.annotations.length === 0 && this.undoStack.length === 0) return;
    if (this.undoStack.length > 0) {
      this.redoStack.push(this.annotations.map((a) => this.cloneAnnotation(a)));
      this.annotations = this.undoStack.pop()!;
    } else {
      const removed = this.annotations.pop();
      if (removed) this.redoStack.push([removed]);
    }
    this.selectedId = null;
    this.redraw();
    this.emitChange();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this.annotations.map((a) => this.cloneAnnotation(a)));
    this.annotations = this.redoStack.pop()!;
    this.selectedId = null;
    this.redraw();
    this.emitChange();
  }

  clear() {
    if (this.annotations.length === 0) return;
    this.pushHistory();
    this.annotations = [];
    this.selectedId = null;
    this.hoveredEraseId = null;
    this.redraw();
    this.emitChange();
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

  private distToSegment(p: MarkupPoint, a: MarkupPoint, b: MarkupPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  private getAnnotationBBox(ann: MarkupAnnotation): { x: number; y: number; w: number; h: number } | null {
    if (ann.type === 'pen' && ann.points && ann.points.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of ann.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, w: Math.max(12, maxX - minX), h: Math.max(12, maxY - minY) };
    }
    if (ann.type === 'text' && ann.startPoint && ann.text) {
      const fontSize = Math.max(13, (ann.strokeWidth || 2) * 4 + 6);
      const font = ann.fontFamily || this.currentFontFamily;
      this.ctx.save();
      this.ctx.font = `700 ${fontSize}px ${font}`;
      const measuredW = this.ctx.measureText(ann.text).width;
      this.ctx.restore();
      return {
        x: ann.startPoint.x,
        y: ann.startPoint.y - fontSize * 0.85,
        w: Math.max(24, measuredW + 4),
        h: fontSize + 4,
      };
    }
    if (ann.startPoint && ann.endPoint) {
      const x = Math.min(ann.startPoint.x, ann.endPoint.x);
      const y = Math.min(ann.startPoint.y, ann.endPoint.y);
      const w = Math.max(12, Math.abs(ann.endPoint.x - ann.startPoint.x));
      const h = Math.max(12, Math.abs(ann.endPoint.y - ann.startPoint.y));
      return { x, y, w, h };
    }
    return null;
  }

  private toLocalPt(pt: MarkupPoint, box: { x: number; y: number; w: number; h: number }, rot = 0): MarkupPoint {
    if (!rot) return pt;
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const cos = Math.cos(-rot);
    const sin = Math.sin(-rot);
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  private getHandlePositions(box: { x: number; y: number; w: number; h: number }): Record<TransformHandle, MarkupPoint> {
    const mx = box.x + box.w / 2;
    const my = box.y + box.h / 2;
    return {
      tl: { x: box.x, y: box.y },
      t: { x: mx, y: box.y },
      tr: { x: box.x + box.w, y: box.y },
      r: { x: box.x + box.w, y: my },
      br: { x: box.x + box.w, y: box.y + box.h },
      b: { x: mx, y: box.y + box.h },
      bl: { x: box.x, y: box.y + box.h },
      l: { x: box.x, y: my },
      rotate: { x: mx, y: box.y - 24 },
    };
  }

  private hitTestHandles(pt: MarkupPoint, ann: MarkupAnnotation): TransformHandle | null {
    const box = this.getAnnotationBBox(ann);
    if (!box) return null;
    const local = this.toLocalPt(pt, box, ann.rotation || 0);
    const handles = this.getHandlePositions(box);
    for (const key of Object.keys(handles) as TransformHandle[]) {
      const h = handles[key];
      if (Math.hypot(local.x - h.x, local.y - h.y) <= 13) {
        return key;
      }
    }
    return null;
  }

  private getHandleCursor(handle: TransformHandle): string {
    if (handle === 'rotate') return 'grab';
    if (handle === 'tl' || handle === 'br') return 'nwse-resize';
    if (handle === 'tr' || handle === 'bl') return 'nesw-resize';
    if (handle === 't' || handle === 'b') return 'ns-resize';
    return 'ew-resize';
  }

  private findAnnotationAt(pt: MarkupPoint): MarkupAnnotation | null {
    const pad = 10;
    for (let i = this.annotations.length - 1; i >= 0; i--) {
      const ann = this.annotations[i];
      const box = this.getAnnotationBBox(ann);
      if (!box) continue;
      const local = this.toLocalPt(pt, box, ann.rotation || 0);

      if (ann.type === 'pen' && ann.points) {
        for (let j = 1; j < ann.points.length; j++) {
          if (this.distToSegment(local, ann.points[j - 1], ann.points[j]) <= 12) {
            return ann;
          }
        }
      } else if ((ann.type === 'arrow' || ann.type === 'line' || ann.type === 'ruler') && ann.startPoint && ann.endPoint) {
        if (this.distToSegment(local, ann.startPoint, ann.endPoint) <= 12) {
          return ann;
        }
      } else if (
        local.x >= box.x - pad &&
        local.x <= box.x + box.w + pad &&
        local.y >= box.y - pad &&
        local.y <= box.y + box.h + pad
      ) {
        return ann;
      }
    }
    return null;
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    const pt = this.getPoint(e);

    if (this.currentTool === 'eraser') {
      const hit = this.findAnnotationAt(pt);
      if (hit) {
        this.pushHistory();
        this.annotations = this.annotations.filter((a) => a.id !== hit.id);
        this.hoveredEraseId = null;
        this.redraw();
        this.emitChange();
      }
      return;
    }

    if (this.currentTool === 'select') {
      if (this.selectedId) {
        const sel = this.annotations.find((a) => a.id === this.selectedId);
        if (sel) {
          const handle = this.hitTestHandles(pt, sel);
          if (handle) {
            this.pushHistory();
            this.activeHandle = handle;
            this.lastDragPt = pt;
            this.initialBBox = this.getAnnotationBBox(sel);
            this.initialAnnotationSnapshot = this.cloneAnnotation(sel);
            this.canvas.style.cursor = handle === 'rotate' ? 'crosshair' : 'nwse-resize';
            return;
          }
        }
      }

      const hit = this.findAnnotationAt(pt);
      if (hit) {
        this.pushHistory();
        this.selectedId = hit.id;
        this.activeHandle = 'move';
        this.lastDragPt = pt;
        this.canvas.style.cursor = 'grabbing';
      } else {
        this.selectedId = null;
        this.activeHandle = null;
      }
      this.redraw();
      return;
    }

    if (this.currentTool === 'text') {
      const hitText = this.findAnnotationAt(pt);
      if (hitText && hitText.type === 'text') {
        this.selectedId = hitText.id;
        this.activeHandle = 'move';
        this.lastDragPt = pt;
        this.canvas.style.cursor = 'grabbing';
        this.redraw();
        return;
      }
      this.showInlineTextInput(e.clientX, e.clientY, pt);
      return;
    }

    this.isDrawing = true;
    const id = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (this.currentTool === 'pen') {
      this.currentAnnotation = {
        id,
        type: 'pen',
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        points: [pt],
      };
    } else if (this.currentTool === 'ruler') {
      this.currentAnnotation = {
        id,
        type: 'ruler',
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        startPoint: pt,
        endPoint: pt,
        text: '0px',
      };
    } else {
      this.currentAnnotation = {
        id,
        type: this.currentTool as MarkupAnnotation['type'],
        color: this.currentColor,
        strokeWidth: this.currentStrokeWidth,
        startPoint: pt,
        endPoint: pt,
      };
    }
  }

  private showInlineTextInput(clientX: number, clientY: number, canvasPt: MarkupPoint) {
    document.getElementById('letme-inline-text-input')?.remove();

    const fontSize = Math.max(13, this.currentStrokeWidth * 4 + 6);
    const input = document.createElement('input');
    input.id = 'letme-inline-text-input';
    input.type = 'text';
    input.placeholder = 'Type text...';
    input.style.cssText = `position:fixed;left:${Math.min(window.innerWidth - 220, Math.max(10, clientX))}px;top:${Math.min(window.innerHeight - 40, Math.max(10, clientY - fontSize))}px;min-width:140px;max-width:320px;background:rgba(5,5,5,0.55);border:1px dashed ${this.currentColor};border-radius:3px;color:${this.currentColor};font-size:${fontSize}px;font-weight:700;font-family:${this.currentFontFamily};padding:2px 6px;outline:none;z-index:2147483647;`;

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const val = input.value.trim();
      if (val) {
        this.pushHistory();
        this.annotations.push({
          id: `ann_text_${Date.now()}`,
          type: 'text',
          startPoint: canvasPt,
          text: val,
          color: this.currentColor,
          strokeWidth: this.currentStrokeWidth,
          fontFamily: this.currentFontFamily,
        });
        this.redraw();
        this.emitChange();
      }
      input.remove();
    };

    input.addEventListener('mousedown', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') {
        committed = true;
        input.remove();
      }
    });
    input.addEventListener('blur', commit);

    document.body.appendChild(input);
    setTimeout(() => input.focus(), 0);
  }

  private applyTransform(ann: MarkupAnnotation, pt: MarkupPoint) {
    if (this.activeHandle === 'move') {
      const dx = pt.x - this.lastDragPt.x;
      const dy = pt.y - this.lastDragPt.y;
      this.lastDragPt = pt;
      ann.points?.forEach((p) => { p.x += dx; p.y += dy; });
      if (ann.startPoint) { ann.startPoint.x += dx; ann.startPoint.y += dy; }
      if (ann.endPoint) { ann.endPoint.x += dx; ann.endPoint.y += dy; }
      if (ann.blurArea) { ann.blurArea.x += dx; ann.blurArea.y += dy; }
      return;
    }

    if (!this.initialBBox || !this.initialAnnotationSnapshot) return;
    const b0 = this.initialBBox;
    const snap = this.initialAnnotationSnapshot;

    if (this.activeHandle === 'rotate') {
      const cx = b0.x + b0.w / 2;
      const cy = b0.y + b0.h / 2;
      ann.rotation = Math.atan2(pt.y - cy, pt.x - cx) + Math.PI / 2;
      return;
    }

    // 8-handle resize in local space
    const local = this.toLocalPt(pt, b0, ann.rotation || 0);
    let nx1 = b0.x, ny1 = b0.y, nx2 = b0.x + b0.w, ny2 = b0.y + b0.h;
    const h = this.activeHandle!;
    if (h.includes('l')) nx1 = Math.min(nx2 - 12, local.x);
    if (h.includes('r')) nx2 = Math.max(nx1 + 12, local.x);
    if (h.includes('t')) ny1 = Math.min(ny2 - 12, local.y);
    if (h.includes('b')) ny2 = Math.max(ny1 + 12, local.y);

    const nw = nx2 - nx1;
    const nh = ny2 - ny1;
    const sx = nw / Math.max(1, b0.w);
    const sy = nh / Math.max(1, b0.h);

    if (snap.points && ann.points) {
      ann.points = snap.points.map((p) => ({
        x: nx1 + (p.x - b0.x) * sx,
        y: ny1 + (p.y - b0.y) * sy,
      }));
    } else if (ann.type === 'text' && snap.startPoint) {
      const nextFontSize = Math.max(12, nh - 6);
      ann.strokeWidth = Math.max(1, Math.min(24, Math.round((nextFontSize - 6) / 4)));
      ann.startPoint = { x: nx1, y: ny1 + nextFontSize };
    } else if (snap.startPoint && snap.endPoint) {
      ann.startPoint = {
        x: nx1 + (snap.startPoint.x - b0.x) * sx,
        y: ny1 + (snap.startPoint.y - b0.y) * sy,
      };
      ann.endPoint = {
        x: nx1 + (snap.endPoint.x - b0.x) * sx,
        y: ny1 + (snap.endPoint.y - b0.y) * sy,
      };
      if (ann.type === 'ruler') {
        const dist = Math.round(Math.hypot(ann.endPoint.x - ann.startPoint.x, ann.endPoint.y - ann.startPoint.y));
        ann.text = `${dist}px`;
      }
      if (ann.type === 'blur') {
        ann.blurArea = { x: nx1, y: ny1, width: nw, height: nh };
      }
    }
  }

  private onMouseMove(e: MouseEvent) {
    const pt = this.getPoint(e);

    if (this.activeHandle && this.selectedId) {
      const sel = this.annotations.find((a) => a.id === this.selectedId);
      if (sel) {
        this.applyTransform(sel, pt);
        this.redraw();
      }
      return;
    }

    if (this.currentTool === 'eraser' && !this.isDrawing) {
      const hit = this.findAnnotationAt(pt);
      const nextId = hit ? hit.id : null;
      if (nextId !== this.hoveredEraseId) {
        this.hoveredEraseId = nextId;
        this.redraw();
      }
      return;
    }

    if (this.currentTool === 'select' && !this.isDrawing) {
      if (this.selectedId) {
        const sel = this.annotations.find((a) => a.id === this.selectedId);
        if (sel) {
          const handle = this.hitTestHandles(pt, sel);
          if (handle) {
            this.canvas.style.cursor = this.getHandleCursor(handle);
            return;
          }
        }
      }
      const hit = this.findAnnotationAt(pt);
      this.canvas.style.cursor = hit ? 'grab' : 'default';
      return;
    }

    if (!this.isDrawing || !this.currentAnnotation) return;

    if (this.currentAnnotation.type === 'pen' && this.currentAnnotation.points) {
      this.currentAnnotation.points.push(pt);
    } else {
      this.currentAnnotation.endPoint = pt;
      if (this.currentAnnotation.type === 'ruler' && this.currentAnnotation.startPoint) {
        const dx = pt.x - this.currentAnnotation.startPoint.x;
        const dy = pt.y - this.currentAnnotation.startPoint.y;
        this.currentAnnotation.text = `${Math.round(Math.hypot(dx, dy))}px`;
      }
    }

    this.redraw();
    this.drawAnnotation(this.currentAnnotation);
  }

  private onMouseUp() {
    if (this.activeHandle) {
      this.activeHandle = null;
      this.initialBBox = null;
      this.initialAnnotationSnapshot = null;
      this.canvas.style.cursor = this.currentTool === 'select' ? 'default' : 'text';
      this.redraw();
      this.emitChange();
      return;
    }

    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.currentAnnotation) {
      const sp = this.currentAnnotation.startPoint;
      const ep = this.currentAnnotation.endPoint;
      const isTinyShape = sp && ep && Math.hypot(ep.x - sp.x, ep.y - sp.y) < 4;
      const isTinyPen =
        this.currentAnnotation.type === 'pen' &&
        (!this.currentAnnotation.points || this.currentAnnotation.points.length < 2);

      if (isTinyShape || isTinyPen) {
        this.currentAnnotation = null;
        this.redraw();
        return;
      }

      if (this.currentAnnotation.type === 'blur' && sp && ep) {
        this.currentAnnotation.blurArea = {
          x: Math.min(sp.x, ep.x),
          y: Math.min(sp.y, ep.y),
          width: Math.abs(ep.x - sp.x),
          height: Math.abs(ep.y - sp.y),
        };
      }

      this.pushHistory();
      this.annotations.push(this.currentAnnotation);
      this.currentAnnotation = null;
      this.redraw();
      this.emitChange();
    }
  }

  private redraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const ann of this.annotations) {
      this.drawAnnotation(ann);
      if (ann.id === this.hoveredEraseId) {
        const box = this.getAnnotationBBox(ann);
        if (box) {
          this.ctx.save();
          this.ctx.strokeStyle = '#ef4444';
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([4, 3]);
          this.ctx.strokeRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8);
          this.ctx.restore();
        }
      }
      if (ann.id === this.selectedId && this.currentTool === 'select') {
        this.drawTransformControls(ann);
      }
    }
  }

  private drawTransformControls(ann: MarkupAnnotation) {
    const box = this.getAnnotationBBox(ann);
    if (!box) return;
    const ctx = this.ctx;
    ctx.save();
    if (ann.rotation) {
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(ann.rotation);
      ctx.translate(-cx, -cy);
    }

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    const handles = this.getHandlePositions(box);
    ctx.beginPath();
    ctx.moveTo(handles.t.x, handles.t.y);
    ctx.lineTo(handles.rotate.x, handles.rotate.y);
    ctx.stroke();

    (['tl', 't', 'tr', 'r', 'br', 'b', 'bl', 'l'] as TransformHandle[]).forEach((k) => {
      const h = handles[k];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 1.5;
      ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
      ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
    });

    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#050505';
    ctx.beginPath();
    ctx.arc(handles.rotate.x, handles.rotate.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawAnnotation(ann: MarkupAnnotation) {
    const ctx = this.ctx;
    const color = ann.color || '#ffffff';
    const strokeWidth = ann.strokeWidth || 2;
    const box = this.getAnnotationBBox(ann);

    ctx.save();
    if (ann.rotation && box) {
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(ann.rotation);
      ctx.translate(-cx, -cy);
    }

    if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(ann.points[0].x, ann.points[0].y);
      for (let i = 1; i < ann.points.length; i++) ctx.lineTo(ann.points[i].x, ann.points[i].y);
      ctx.stroke();
    } else if (ann.type === 'arrow' && ann.startPoint && ann.endPoint) {
      this.drawArrow(ann.startPoint, ann.endPoint, color, strokeWidth);
    } else if (ann.type === 'line' && ann.startPoint && ann.endPoint) {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ann.startPoint.x, ann.startPoint.y);
      ctx.lineTo(ann.endPoint.x, ann.endPoint.y);
      ctx.stroke();
    } else if (SHAPE_TOOLS.has(ann.type as MarkupTool) && ann.startPoint && ann.endPoint) {
      const x = Math.min(ann.startPoint.x, ann.endPoint.x);
      const y = Math.min(ann.startPoint.y, ann.endPoint.y);
      const w = Math.abs(ann.endPoint.x - ann.startPoint.x);
      const h = Math.abs(ann.endPoint.y - ann.startPoint.y);

      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;

      if (ann.type === 'box') {
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
      } else if (ann.type === 'rounded-box') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, Math.min(14, Math.min(w, h) / 4));
        ctx.stroke();
      } else if (ann.type === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, Math.max(1, w / 2), Math.max(1, h / 2), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (ann.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (ann.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.stroke();
      } else if (ann.type === 'callout') {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, Math.min(w, h) / 2);
        ctx.stroke();
      }
    } else if (ann.type === 'ruler' && ann.startPoint && ann.endPoint) {
      this.drawRuler(ann.startPoint, ann.endPoint, ann.text || '', color, strokeWidth);
    } else if (ann.type === 'text' && ann.startPoint && ann.text) {
      const fontSize = Math.max(13, strokeWidth * 4 + 6);
      const font = ann.fontFamily || this.currentFontFamily;
      ctx.font = `700 ${fontSize}px ${font}`;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.fillStyle = color;
      ctx.fillText(ann.text, ann.startPoint.x, ann.startPoint.y);
    } else if (ann.type === 'blur' && ann.startPoint && ann.endPoint) {
      const x = Math.min(ann.startPoint.x, ann.endPoint.x);
      const y = Math.min(ann.startPoint.y, ann.endPoint.y);
      const w = Math.abs(ann.endPoint.x - ann.startPoint.x);
      const h = Math.abs(ann.endPoint.y - ann.startPoint.y);

      // Pixelated mosaic grid
      const cell = 10;
      const shades = ['#18181b', '#27272a', '#09090b', '#3f3f46', '#1f1f23'];
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      for (let py = y; py < y + h; py += cell) {
        for (let px = x; px < x + w; px += cell) {
          const idx = Math.abs(Math.floor(px / cell) * 7 + Math.floor(py / cell) * 13) % shades.length;
          ctx.fillStyle = shades[idx];
          ctx.fillRect(px, py, cell, cell);
        }
      }
      ctx.restore();

      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      // Centered censored badge + lock icon
      if (w >= 48 && h >= 22) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        ctx.fillStyle = 'rgba(5, 5, 5, 0.88)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - 44, cy - 11, 88, 22, 4);
        ctx.fill();
        ctx.stroke();

        // Mini shield/lock icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.strokeRect(cx - 36, cy - 3, 8, 7);
        ctx.beginPath();
        ctx.arc(cx - 32, cy - 3, 3, Math.PI, 0);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.fillText('CENSORED', cx - 23, cy + 3);
      }
    }

    ctx.restore();
  }

  private drawArrow(from: MarkupPoint, to: MarkupPoint, color: string, strokeWidth: number) {
    const ctx = this.ctx;
    const headlen = Math.max(12, strokeWidth * 4);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
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

  private drawRuler(from: MarkupPoint, to: MarkupPoint, label: string, color: string, strokeWidth: number) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
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

    if (label) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.font = 'bold 11px monospace';
      const metrics = ctx.measureText(label);
      ctx.fillStyle = '#050505';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(midX - metrics.width / 2 - 6, midY - 11, metrics.width + 12, 20, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillText(label, midX - metrics.width / 2, midY + 3);
    }
  }

  async exportAnnotatedScreenshot(
    baseImageUrl: string,
    cropBox?: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    const offscreen = document.createElement('canvas');
    offscreen.width = this.canvas.width;
    offscreen.height = this.canvas.height;
    const octx = offscreen.getContext('2d')!;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = baseImageUrl;
    });

    octx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
    octx.drawImage(this.canvas, 0, 0);

    if (cropBox && cropBox.width > 0 && cropBox.height > 0) {
      const pad = 40;
      const cx = Math.max(0, cropBox.x - pad);
      const cy = Math.max(0, cropBox.y - pad);
      const cw = Math.min(offscreen.width - cx, cropBox.width + pad * 2);
      const ch = Math.min(offscreen.height - cy, cropBox.height + pad * 2);

      const cropped = document.createElement('canvas');
      cropped.width = cw;
      cropped.height = ch;
      const cctx = cropped.getContext('2d')!;
      cctx.drawImage(offscreen, cx, cy, cw, ch, 0, 0, cw, ch);
      return cropped.toDataURL('image/png');
    }

    return offscreen.toDataURL('image/png');
  }

  destroy() {
    this.canvas.remove();
    document.getElementById('letme-inline-text-input')?.remove();
  }
}
