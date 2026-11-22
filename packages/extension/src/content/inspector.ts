import {
  getBoxModel,
  getContainerContext,
  diagnoseLayoutBugs,
  getUniqueSelector,
  getCleanHtmlSnippet,
  getKeyComputedStyles,
} from './layoutEngine.js';
import { MarkupStudio } from './markupStudio.js';
import { OverlayUi } from './overlayUi.js';
import { wsClient } from '../wsClient.js';
import { ElementSnapshot } from '@letme/shared';

export class ElementInspector {
  private isActive: boolean = false;
  private hoverOverlay: HTMLDivElement | null = null;
  private hoverLabel: HTMLDivElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private markupStudio: MarkupStudio | null = null;
  private overlayUi: OverlayUi | null = null;
  private latestSnapshot: ElementSnapshot | null = null;

  constructor() {
    this.overlayUi = new OverlayUi({
      onSendToAi: (instructions, bugNotes) => this.handleSendToAi(instructions, bugNotes),
      onClose: () => this.stop(),
      onClear: () => this.markupStudio?.clear(),
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
    this.createHoverElements();
    this.attachEventListeners();
    this.overlayUi?.showToast('🎯 LetMe Inspector Active: Hover and click any element to inspect');
  }

  stop() {
    this.isActive = false;
    this.removeHoverElements();
    this.detachEventListeners();
    this.markupStudio?.destroy();
    this.markupStudio = null;
    this.overlayUi?.remove();
    this.selectedElement = null;
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }

  private createHoverElements() {
    if (this.hoverOverlay) return;

    this.hoverOverlay = document.createElement('div');
    this.hoverOverlay.id = 'letme-hover-overlay';
    this.hoverOverlay.style.position = 'fixed';
    this.hoverOverlay.style.pointerEvents = 'none';
    this.hoverOverlay.style.zIndex = '2147483645';
    this.hoverOverlay.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
    this.hoverOverlay.style.border = '2px solid #6366f1';
    this.hoverOverlay.style.borderRadius = '3px';
    this.hoverOverlay.style.display = 'none';
    this.hoverOverlay.style.transition = 'all 0.05s ease-out';

    this.hoverLabel = document.createElement('div');
    this.hoverLabel.id = 'letme-hover-label';
    this.hoverLabel.style.position = 'absolute';
    this.hoverLabel.style.top = '-26px';
    this.hoverLabel.style.left = '0';
    this.hoverLabel.style.backgroundColor = '#1e1b4b';
    this.hoverLabel.style.color = '#e0e7ff';
    this.hoverLabel.style.padding = '2px 8px';
    this.hoverLabel.style.borderRadius = '4px';
    this.hoverLabel.style.fontSize = '11px';
    this.hoverLabel.style.fontFamily = 'monospace';
    this.hoverLabel.style.fontWeight = 'bold';
    this.hoverLabel.style.whiteSpace = 'nowrap';
    this.hoverLabel.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

    this.hoverOverlay.appendChild(this.hoverLabel);
    document.body.appendChild(this.hoverOverlay);
  }

  private removeHoverElements() {
    this.hoverOverlay?.remove();
    this.hoverOverlay = null;
    this.hoverLabel = null;
  }

  private attachEventListeners() {
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
  }

  private detachEventListeners() {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isActive || this.selectedElement) return;

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

    // Position label inside if overflowing top
    if (rect.top < 30) {
      this.hoverLabel.style.top = '4px';
    } else {
      this.hoverLabel.style.top = '-26px';
    }
  };

  private onClick = (e: MouseEvent) => {
    if (!this.isActive || this.selectedElement) return;

    // Check if clicked inside any LetMe overlay UI, modal, or markup studio
    const target = e.target as HTMLElement;
    if (target.closest('[id^="letme-"]') || target.closest('[class*="letme-"]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const clickedEl = this.getElementFromCursor(e);
    if (!clickedEl) return;

    this.selectElement(clickedEl);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.stop();
    }
  };

  private getElementFromCursor(e: MouseEvent): HTMLElement | null {
    // Hide overlay temporarily to pick underlying element
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'hidden';
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (this.hoverOverlay) this.hoverOverlay.style.visibility = 'visible';

    if (!el || el === document.body || el === document.documentElement) return null;
    if (el.closest('[id^="letme-"]') || el.closest('[class*="letme-"]')) {
      return null;
    }

    return el;
  }

  private selectElement(element: HTMLElement) {
    this.selectedElement = element;
    if (this.hoverOverlay) this.hoverOverlay.style.display = 'none';

    // Initialize Markup Studio Canvas
    this.markupStudio?.destroy();
    this.markupStudio = new MarkupStudio(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.markupStudio.getCanvasElement());

    const selector = getUniqueSelector(element);
    const boxModel = getBoxModel(element);
    const bugs = diagnoseLayoutBugs(element);

    // Show Floating UI
    this.overlayUi?.show(element, selector, boxModel, bugs, this.markupStudio);
  }

  private async handleSendToAi(instructions: string, bugNotes: string) {
    if (!this.selectedElement || !this.markupStudio) return;

    this.overlayUi?.showToast('Capturing screenshot and analyzing layout...');

    try {
      // 1. Request full visible tab screenshot from background worker
      const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const rawScreenshotUrl: string = response?.dataUrl || '';

      const selector = getUniqueSelector(this.selectedElement);
      const boxModel = getBoxModel(this.selectedElement);
      const layoutContext = getContainerContext(this.selectedElement);
      const layoutBugs = diagnoseLayoutBugs(this.selectedElement);
      const computedStyles = getKeyComputedStyles(this.selectedElement);
      const outerHtml = getCleanHtmlSnippet(this.selectedElement);
      const innerText = this.selectedElement.innerText?.substring(0, 500);

      // 2. Export annotated screenshot cropped to element
      let annotatedScreenshotBase64: string | undefined;
      if (rawScreenshotUrl) {
        annotatedScreenshotBase64 = await this.markupStudio.exportAnnotatedScreenshot(
          rawScreenshotUrl,
          boxModel.boundingBox
        );
      }

      const snapshot: ElementSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        url: window.location.href,
        pageTitle: document.title,
        selector,
        tagName: this.selectedElement.tagName.toLowerCase(),
        idAttribute: this.selectedElement.id || undefined,
        classNames: Array.from(this.selectedElement.classList),
        outerHtmlSnippet: outerHtml,
        innerTextSnippet: innerText,
        boxModel,
        layoutContext,
        layoutBugs,
        computedStyles,
        screenshotBase64: annotatedScreenshotBase64,
        userInstructions: instructions.trim() || undefined,
        userBugNotes: bugNotes.trim() || undefined,
        annotations: this.markupStudio.getAnnotations(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      };

      this.latestSnapshot = snapshot;

      // 3. Send to background bridge service
      chrome.runtime.sendMessage({
        type: 'ELEMENT_CAPTURED',
        payload: snapshot,
      });

      this.overlayUi?.showToast('🚀 Sent to AI via MCP! Your AI assistant now has this element.');
    } catch (err: any) {
      console.error('[LetMe] Error capturing element:', err);
      this.overlayUi?.showToast(`Error sending: ${err.message}`, true);
    }
  }
}

export const elementInspector = new ElementInspector();
