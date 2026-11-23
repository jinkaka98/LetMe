import { getLucideSvg } from '../icons.js';
import {
  getBoxModel,
  getContainerContext,
  diagnoseLayoutBugs,
  getUniqueSelector,
  getCleanHtmlSnippet,
  getKeyComputedStyles,
} from './layoutEngine.js';
import { getRecentConsoleLogs } from './contentScript.js';
import {
  BoxModelMetrics,
  ContainerLayoutContext,
  LayoutBugReport,
  ElementSnapshot,
  ConsoleLogEntry,
} from '@letme/shared';

export interface StagedElementInfo {
  id: string;
  selector: string;
  tagName: string;
  idAttribute?: string;
  classNames: string[];
  role?: string;
  textSummary: string;
  boxModel: BoxModelMetrics;
  layoutContext: ContainerLayoutContext;
  layoutBugs: LayoutBugReport;
  screenshotBase64?: string;
  userNote: string;
  outerHtml: string;
  computedStyles: Record<string, string>;
  consoleLogs: ConsoleLogEntry[];
  timestamp: number;
}

export class MultiPicker {
  private isActive: boolean = false;
  private stagedElements: StagedElementInfo[] = [];
  private hoverOverlay: HTMLDivElement | null = null;
  private stagingPill: HTMLDivElement | null = null;
  private stagingDrawer: HTMLDivElement | null = null;
  private isDrawerOpen: boolean = false;

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.createHoverOverlay();
    this.renderStagingPill();
    this.attachEvents();
    this.showToast('Multi-Pick Active: Click any element to pick and auto-copy to clipboard');
  }

  stop() {
    this.isActive = false;
    this.removeHoverOverlay();
    this.detachEvents();
    this.stagingPill?.remove();
    this.stagingDrawer?.remove();
    this.stagingPill = null;
    this.stagingDrawer = null;
  }

  toggle() {
    if (this.isActive) this.stop();
    else this.start();
  }

  private createHoverOverlay() {
    if (this.hoverOverlay) return;
    this.hoverOverlay = document.createElement('div');
    this.hoverOverlay.id = 'letme-multipick-hover';
    this.hoverOverlay.style.position = 'fixed';
    this.hoverOverlay.style.pointerEvents = 'none';
    this.hoverOverlay.style.zIndex = '2147483645';
    this.hoverOverlay.style.border = '2px dashed #ffffff';
    this.hoverOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    this.hoverOverlay.style.boxShadow = '0 0 0 1px #000000';
    this.hoverOverlay.style.display = 'none';

    document.body.appendChild(this.hoverOverlay);
  }

  private removeHoverOverlay() {
    this.hoverOverlay?.remove();
    this.hoverOverlay = null;
  }

  private attachEvents() {
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  private detachEvents() {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isActive) return;
    const target = this.getElementFromCursor(e);
    if (!target || !this.hoverOverlay) {
      if (this.hoverOverlay) this.hoverOverlay.style.display = 'none';
      return;
    }

    const rect = target.getBoundingClientRect();
    this.hoverOverlay.style.display = 'block';
    this.hoverOverlay.style.top = `${rect.top}px`;
    this.hoverOverlay.style.left = `${rect.left}px`;
    this.hoverOverlay.style.width = `${rect.width}px`;
    this.hoverOverlay.style.height = `${rect.height}px`;
  };

  private onClick = (e: MouseEvent) => {
    if (!this.isActive) return;

    const target = e.target as HTMLElement;
    if (target.closest('[id^="letme-"]') || target.closest('[class*="letme-"]')) {
      return; // Do not intercept clicks on staging UI
    }

    e.preventDefault();
    e.stopPropagation();

    const clickedEl = this.getElementFromCursor(e);
    if (!clickedEl) return;

    this.pickElement(clickedEl);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.stop();
    }
  };

  private getElementFromCursor(e: MouseEvent): HTMLElement | null {
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'hidden';
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'visible';

    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.closest('[id^="letme-"]') || el.closest('[class*="letme-"]')) {
      return null;
    }

    return el;
  }

  private async captureElementCrop(el: HTMLElement): Promise<string | undefined> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const rawDataUrl: string = response?.dataUrl || '';
      if (!rawDataUrl) return undefined;

      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = rawDataUrl;
      });

      const dpr = window.devicePixelRatio || 1;
      const rect = el.getBoundingClientRect();
      const pad = 24;
      const cropX = Math.max(0, rect.left - pad);
      const cropY = Math.max(0, rect.top - pad);
      const cropW = Math.min(window.innerWidth - cropX, rect.width + pad * 2);
      const cropH = Math.min(window.innerHeight - cropY, rect.height + pad * 2);

      if (cropW <= 0 || cropH <= 0) return undefined;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.round(cropW * dpr);
      cropCanvas.height = Math.round(cropH * dpr);
      const ctx = cropCanvas.getContext('2d')!;

      ctx.drawImage(
        img,
        Math.round(cropX * dpr),
        Math.round(cropY * dpr),
        Math.round(cropW * dpr),
        Math.round(cropH * dpr),
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );

      return cropCanvas.toDataURL('image/png');
    } catch (err) {
      console.warn('[LetMe MultiPicker] Crop screenshot error:', err);
      return undefined;
    }
  }

  private async pickElement(el: HTMLElement) {
    const selector = getUniqueSelector(el);
    const boxModel = getBoxModel(el);
    const layoutContext = getContainerContext(el);
    const layoutBugs = diagnoseLayoutBugs(el);
    const computedStyles = getKeyComputedStyles(el);
    const outerHtml = getCleanHtmlSnippet(el);
    const textContent = el.innerText?.trim().substring(0, 150) || '';
    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const consoleLogs = getRecentConsoleLogs();

    // Auto-capture crop screenshot
    const screenshotBase64 = await this.captureElementCrop(el);

    const item: StagedElementInfo = {
      id: `pick_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      selector,
      tagName: el.tagName.toLowerCase(),
      idAttribute: el.id || undefined,
      classNames: Array.from(el.classList),
      role,
      textSummary: textContent,
      boxModel,
      layoutContext,
      layoutBugs,
      screenshotBase64,
      userNote: '',
      outerHtml,
      computedStyles,
      consoleLogs,
      timestamp: Date.now(),
    };

    this.stagedElements.push(item);

    // 1. Auto-copy formatted markdown to clipboard
    const singleElementMarkdown = this.formatSingleElementMarkdown(item);
    this.copyToClipboard(singleElementMarkdown);

    // 2. Toast notification
    this.showToast(`Copied <${item.tagName}> with Screenshot & Diagnostics! (${this.stagedElements.length} staged)`);

    // 3. Update Staging Pill
    this.renderStagingPill();
    if (this.isDrawerOpen) {
      this.renderDrawerContent();
    }
  }

  private formatSingleElementMarkdown(item: StagedElementInfo): string {
    const lines: string[] = [];
    lines.push(`### Target Element: <${item.tagName}> \`${item.selector}\``);
    lines.push(`- **Function / Role**: \`${item.role || item.tagName}\``);
    if (item.textSummary) {
      lines.push(`- **Visible Text**: "${item.textSummary}"`);
    }
    lines.push(`- **Rendered Size**: ${item.boxModel.width}px × ${item.boxModel.height}px (Padding: ${item.boxModel.padding.top}px, Margin: ${item.boxModel.margin.top}px)`);
    lines.push(`- **Parent Container**: \`${item.layoutContext.parentTagName}\` (display: \`${item.layoutContext.display}\`)`);

    // Layout Diagnostics
    lines.push(`- **Layout Diagnostics**:`);
    if (item.layoutBugs.hasHorizontalScrollLeak) {
      lines.push(`  - Horizontal Scroll Leak Detected`);
    }
    if (item.layoutBugs.isClippedByAncestor) {
      lines.push(`  - Ancestor Clipping by \`${item.layoutBugs.clippingAncestorSelector || 'unknown'}\``);
    }
    if (item.layoutBugs.hasZIndexConflict) {
      lines.push(`  - Z-Index Conflict (z-index: \`${item.layoutBugs.zIndex}\`)`);
    }
    if (item.layoutBugs.warnings.length === 0 && !item.layoutBugs.hasHorizontalScrollLeak) {
      lines.push(`  - Clean layout bounds`);
    }

    if (item.userNote) {
      lines.push(`- **User Bug Note / Instruction**: "${item.userNote}"`);
    }

    if (item.screenshotBase64) {
      lines.push(`- **Screenshot Crop**: [Captured PNG Base64 available in MCP payload]`);
    }

    lines.push('');
    lines.push('```html');
    lines.push(item.outerHtml);
    lines.push('```');
    lines.push('');
    lines.push('```css');
    for (const [k, v] of Object.entries(item.computedStyles).slice(0, 10)) {
      lines.push(`  ${k}: ${v};`);
    }
    lines.push('```');
    return lines.join('\n');
  }

  private formatAllStagedMarkdown(): string {
    if (this.stagedElements.length === 0) return 'No elements staged.';

    const lines: string[] = [];
    lines.push(`# Staged Frontend Elements (${this.stagedElements.length} items from ${document.title})`);
    lines.push(`**URL**: ${window.location.href}`);
    lines.push(`**Captured At**: ${new Date().toISOString()}\n`);

    this.stagedElements.forEach((item, idx) => {
      lines.push(`---`);
      lines.push(`## [${idx + 1}] <${item.tagName}> \`${item.selector}\``);
      lines.push(`- **Role**: \`${item.role || item.tagName}\``);
      lines.push(`- **Dimensions**: ${item.boxModel.width}px × ${item.boxModel.height}px`);
      lines.push(`- **Parent Context**: \`${item.layoutContext.parentTagName}\` (display: \`${item.layoutContext.display}\`)`);

      // Diagnostics
      const bugNotes: string[] = [];
      if (item.layoutBugs.hasHorizontalScrollLeak) bugNotes.push('Horizontal scroll leak');
      if (item.layoutBugs.isClippedByAncestor) bugNotes.push(`Clipped by ${item.layoutBugs.clippingAncestorSelector}`);
      if (item.layoutBugs.hasZIndexConflict) bugNotes.push(`Z-index collision (${item.layoutBugs.zIndex})`);
      lines.push(`- **Layout Diagnostics**: ${bugNotes.length > 0 ? bugNotes.join(', ') : 'Clean'}`);

      // User instruction / bug note
      if (item.userNote) {
        lines.push(`- **User Instruction / Bug Report**: > ${item.userNote}`);
      }

      if (item.screenshotBase64) {
        lines.push(`- **Visual Crop**: [PNG Crop captured]`);
      }

      lines.push('');
      lines.push('```html');
      lines.push(item.outerHtml);
      lines.push('```');
      lines.push('');
      lines.push('```css');
      for (const [k, v] of Object.entries(item.computedStyles).slice(0, 8)) {
        lines.push(`  ${k}: ${v};`);
      }
      lines.push('```\n');
    });

    // Console logs if any
    const recentLogs = getRecentConsoleLogs();
    if (recentLogs.length > 0) {
      lines.push(`### Recent Console Logs:`);
      recentLogs.slice(-5).forEach((log) => {
        lines.push(`- [${log.type.toUpperCase()}] ${log.message}`);
      });
      lines.push('');
    }

    lines.push('### Instructions for AI:');
    lines.push('Analyze these components along with their screenshots, layout diagnostics, and user notes to fix the visual and structural issues.');

    return lines.join('\n');
  }

  private async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  private renderStagingPill() {
    if (!this.stagingPill) {
      this.stagingPill = document.createElement('div');
      this.stagingPill.id = 'letme-staging-pill-root';
      this.stagingPill.style.position = 'fixed';
      this.stagingPill.style.bottom = '20px';
      this.stagingPill.style.right = '20px';
      this.stagingPill.style.zIndex = '2147483647';
      this.stagingPill.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      document.body.appendChild(this.stagingPill);
    }

    const count = this.stagedElements.length;

    this.stagingPill.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; background: #09090b; border: 1px solid #27272a; padding: 6px 12px; border-radius: 9999px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); color: #fafafa; font-size: 12px;">
        <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
          <span style="display: inline-flex; align-items: center; color: #38bdf8;">${getLucideSvg('layers', { size: 14, color: '#38bdf8' })}</span>
          <span>${count} Staged</span>
        </span>
        <div style="width: 1px; height: 16px; background: #27272a;"></div>
        <button id="letme-btn-copy-all" style="background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 12px; font-weight: 500; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
          ${getLucideSvg('copy', { size: 12 })} <span>Copy All</span>
        </button>
        <button id="letme-btn-toggle-list" style="background: #18181b; border: 1px solid #27272a; color: #fafafa; cursor: pointer; font-size: 11px; font-weight: 500; padding: 4px 8px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
          <span>Drawer</span> ${this.isDrawerOpen ? getLucideSvg('chevron-up', { size: 11 }) : getLucideSvg('chevron-down', { size: 11 })}
        </button>
        <button id="letme-btn-done" style="background: #fafafa; border: none; color: #09090b; cursor: pointer; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
          ${getLucideSvg('check', { size: 12, color: '#09090b' })} <span>Done</span>
        </button>
      </div>
    `;

    this.stagingPill.querySelector('#letme-btn-copy-all')?.addEventListener('click', () => {
      const allText = this.formatAllStagedMarkdown();
      this.copyToClipboard(allText);
      this.showToast(`Copied all ${this.stagedElements.length} elements to clipboard!`);
    });

    this.stagingPill.querySelector('#letme-btn-toggle-list')?.addEventListener('click', () => {
      this.isDrawerOpen = !this.isDrawerOpen;
      this.renderStagingPill();
      if (this.isDrawerOpen) this.openDrawer();
      else this.closeDrawer();
    });

    this.stagingPill.querySelector('#letme-btn-done')?.addEventListener('click', () => {
      this.stop();
    });
  }

  private openDrawer() {
    if (!this.stagingDrawer) {
      this.stagingDrawer = document.createElement('div');
      this.stagingDrawer.id = 'letme-staging-drawer-root';
      this.stagingDrawer.style.position = 'fixed';
      this.stagingDrawer.style.bottom = '70px';
      this.stagingDrawer.style.right = '20px';
      this.stagingDrawer.style.width = '420px';
      this.stagingDrawer.style.maxHeight = '72vh';
      this.stagingDrawer.style.backgroundColor = '#09090b';
      this.stagingDrawer.style.border = '1px solid #27272a';
      this.stagingDrawer.style.borderRadius = '12px';
      this.stagingDrawer.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.8)';
      this.stagingDrawer.style.zIndex = '2147483647';
      this.stagingDrawer.style.display = 'flex';
      this.stagingDrawer.style.flexDirection = 'column';
      this.stagingDrawer.style.overflow = 'hidden';
      this.stagingDrawer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      this.stagingDrawer.style.color = '#fafafa';
      document.body.appendChild(this.stagingDrawer);
    }
    this.renderDrawerContent();
  }

  private closeDrawer() {
    this.stagingDrawer?.remove();
    this.stagingDrawer = null;
    this.isDrawerOpen = false;
  }

  private renderDrawerContent() {
    if (!this.stagingDrawer) return;

    const itemsHtml = this.stagedElements.length === 0
      ? `<div style="padding: 32px 16px; text-align: center; color: #71717a; font-size: 13px;">No elements in staging. Click any element on the page to add.</div>`
      : this.stagedElements.map((item, idx) => {
        const hasWarning = item.layoutBugs.hasHorizontalScrollLeak || item.layoutBugs.isClippedByAncestor || item.layoutBugs.hasZIndexConflict;
        const diagBadge = hasWarning
          ? `<span style="display:inline-flex; align-items:center; gap:3px; color: #ef4444; font-size: 10px; font-weight: 700;">${getLucideSvg('alert-triangle', { size: 11, color: '#ef4444' })} Issue</span>`
          : `<span style="display:inline-flex; align-items:center; gap:3px; color: #10b981; font-size: 10px; font-weight: 700;">${getLucideSvg('check-circle-2', { size: 11, color: '#10b981' })} Clean</span>`;

        return `
          <div style="padding: 12px; border-bottom: 1px solid #18181b; background: #09090b; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 280px;">
                  [${idx + 1}] &lt;${item.tagName}&gt; ${item.selector}
                </span>
                ${diagBadge}
              </div>
              <button data-delete-id="${item.id}" style="background: none; border: none; color: #71717a; cursor: pointer; padding: 2px 6px; display: inline-flex; align-items: center;" title="Remove element">${getLucideSvg('x', { size: 13 })}</button>
            </div>

            <div style="display: flex; gap: 10px; align-items: center;">
              ${item.screenshotBase64 ? `
                <div style="width: 70px; height: 50px; border: 1px solid #27272a; border-radius: 4px; overflow: hidden; background: #18181b; flex-shrink: 0;">
                  <img src="${item.screenshotBase64}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              ` : ''}
              <div style="font-size: 11px; color: #71717a; font-family: monospace; line-height: 1.4;">
                <div>Size: ${item.boxModel.width}×${item.boxModel.height}px</div>
                <div>Parent: &lt;${item.layoutContext.parentTagName}&gt; (${item.layoutContext.display})</div>
              </div>
            </div>

            <div>
              <input type="text"
                data-note-id="${item.id}"
                placeholder="Catatan bug / instruksi untuk elemen ini..."
                value="${item.userNote || ''}"
                style="width: 100%; box-sizing: border-box; background: #18181b; border: 1px solid #27272a; border-radius: 4px; padding: 6px 8px; font-size: 11px; color: #fafafa; outline: none; font-family: inherit;" />
            </div>
          </div>
        `;
      }).join('');

    this.stagingDrawer.innerHTML = `
      <div style="padding: 12px 16px; background: #18181b; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 600;">Staged Elements (${this.stagedElements.length})</span>
        <button id="letme-btn-clear-all" style="background: none; border: none; color: #71717a; cursor: pointer; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
          ${getLucideSvg('trash-2', { size: 11, color: '#71717a' })} <span>Clear All</span>
        </button>
      </div>

      <div style="overflow-y: auto; flex: 1; max-height: 48vh;">
        ${itemsHtml}
      </div>

      <div style="padding: 12px 16px; background: #18181b; border-top: 1px solid #27272a; display: flex; gap: 8px;">
        <button id="letme-drawer-copy-all" style="flex: 1; padding: 8px 12px; background: #fafafa; border: none; border-radius: 6px; color: #09090b; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${getLucideSvg('copy', { size: 13, color: '#09090b' })} <span>Copy All to AI</span>
        </button>
        <button id="letme-drawer-sync-mcp" style="flex: 1; padding: 8px 12px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #fafafa; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          ${getLucideSvg('zap', { size: 13, color: '#fafafa' })} <span>Sync to MCP</span>
        </button>
      </div>
    `;

    // Bind delete buttons
    this.stagingDrawer.querySelectorAll('button[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.deleteId;
        this.stagedElements = this.stagedElements.filter((item) => item.id !== id);
        this.renderDrawerContent();
        this.renderStagingPill();
      });
    });

    // Bind note inputs
    this.stagingDrawer.querySelectorAll('input[data-note-id]').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const inputEl = e.currentTarget as HTMLInputElement;
        const id = inputEl.dataset.noteId;
        const target = this.stagedElements.find((item) => item.id === id);
        if (target) {
          target.userNote = inputEl.value;
        }
      });
    });

    // Clear all
    this.stagingDrawer.querySelector('#letme-btn-clear-all')?.addEventListener('click', () => {
      this.stagedElements = [];
      this.renderDrawerContent();
      this.renderStagingPill();
    });

    // Copy all
    this.stagingDrawer.querySelector('#letme-drawer-copy-all')?.addEventListener('click', () => {
      const allText = this.formatAllStagedMarkdown();
      this.copyToClipboard(allText);
      this.showToast(`All ${this.stagedElements.length} elements copied with notes & diagnostics!`);
    });

    // Sync to MCP
    this.stagingDrawer.querySelector('#letme-drawer-sync-mcp')?.addEventListener('click', () => {
      this.syncAllToMcp();
    });
  }

  private async syncAllToMcp() {
    if (this.stagedElements.length === 0) return;

    const batchId = `LTM-STG-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;

    // Send individual element snapshots
    for (const item of this.stagedElements) {
      const snap: ElementSnapshot = {
        id: item.id,
        timestamp: item.timestamp,
        url: window.location.href,
        pageTitle: document.title,
        selector: item.selector,
        tagName: item.tagName,
        idAttribute: item.idAttribute,
        classNames: item.classNames,
        outerHtmlSnippet: item.outerHtml,
        innerTextSnippet: item.textSummary,
        boxModel: item.boxModel,
        layoutContext: item.layoutContext,
        layoutBugs: item.layoutBugs,
        computedStyles: item.computedStyles,
        screenshotBase64: item.screenshotBase64,
        userInstructions: item.userNote || 'Multi-staged component pick',
        userBugNotes: item.userNote || undefined,
        annotations: [],
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      };

      chrome.runtime.sendMessage({
        type: 'ELEMENT_CAPTURED',
        payload: snap,
      });
    }

    // Send consolidated master batch under batchId
    const masterHtml = this.stagedElements.map((el, i) => `<!-- [${i + 1}] <${el.tagName}> ${el.selector} -->\n${el.outerHtml}`).join('\n\n');
    const masterNotes = this.stagedElements.map((el, i) => `### Component #${i + 1}: <${el.tagName}> \`${el.selector}\`\n${el.userNote ? `- **User Note**: ${el.userNote}\n` : ''}- **Dimensions**: ${el.boxModel.width}px × ${el.boxModel.height}px\n- **Parent**: \`${el.layoutContext.parentTagName}\` (display: \`${el.layoutContext.display}\`)`).join('\n\n');

    chrome.runtime.sendMessage({
      type: 'ELEMENT_CAPTURED',
      payload: {
        id: batchId,
        timestamp: Date.now(),
        url: window.location.href,
        pageTitle: document.title,
        selector: `body [LetMe Staged Components: ${this.stagedElements.length} Items]`,
        tagName: 'MULTI-ELEMENT-STAGE',
        classNames: ['letme-staged-batch'],
        outerHtmlSnippet: masterHtml,
        innerTextSnippet: `Batch of ${this.stagedElements.length} elements from ${document.title}`,
        boxModel: this.stagedElements[0].boxModel,
        layoutContext: this.stagedElements[0].layoutContext,
        layoutBugs: this.stagedElements[0].layoutBugs,
        computedStyles: this.stagedElements[0].computedStyles,
        screenshotBase64: this.stagedElements[0].screenshotBase64,
        userInstructions: `Analisis dan perbarui ${this.stagedElements.length} komponen yang di-stage pada batch [${batchId}].`,
        userBugNotes: masterNotes,
        annotations: [],
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      },
    });

    // Generate Contextual AI Prompt
    const promptLines: string[] = [];
    promptLines.push(`[LETME MULTI-ELEMENT STAGE: ${batchId}]`);
    promptLines.push(`Saya telah menginspeksi dan mengirimkan ${this.stagedElements.length} komponen UI dari "${document.title}" (${window.location.href}) ke LetMe MCP Bridge.`);
    promptLines.push('');
    promptLines.push(`**PENTING UNTUK CODING AGENT**:`);
    promptLines.push(`Panggil MCP tool \`letme_get_active_element(id="${batchId}")\` untuk membaca data lengkap seluruh komponen ini (termasuk crop screenshot visual, HTML snippet, computed CSS, dan layout diagnostics).`);
    promptLines.push('');
    promptLines.push(`Berikut ringkasan ${this.stagedElements.length} komponen yang telah saya tandai:`);
    this.stagedElements.forEach((item, idx) => {
      promptLines.push(`${idx + 1}. <${item.tagName}> \`${item.selector}\`${item.userNote ? `\n   Catatan/Instruksi: "${item.userNote}"` : ''}`);
    });
    promptLines.push('');
    promptLines.push(`Tolong analisis dan perbarui komponen di atas sesuai instruksi.`);

    const readyPrompt = promptLines.join('\n');
    await this.copyToClipboard(readyPrompt);

    // Update button feedback
    const btn = this.stagingDrawer?.querySelector('#letme-drawer-sync-mcp') as HTMLElement | null;
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px;">${getLucideSvg('check', { size: 12, color: '#fafafa' })} Copied [${batchId}]!</span>`;
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 2500);
    }

    this.showToast(`Synced ${this.stagedElements.length} elements to MCP & copied prompt [${batchId}]! Tinggal Paste (Ctrl+V) di chat AI.`);
  }

  private showToast(message: string) {
    const existing = document.getElementById('letme-multipick-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'letme-multipick-toast';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#09090b';
    toast.style.border = '1px solid #27272a';
    toast.style.color = '#fafafa';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '9999px';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '500';
    toast.style.fontFamily = 'system-ui, sans-serif';
    toast.style.zIndex = '2147483647';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.style.pointerEvents = 'none';
    toast.innerText = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }
}

export const multiPicker = new MultiPicker();
