export class LivePreviewManager {
  private activeStyles: Map<string, HTMLStyleElement> = new Map();
  private defaultStyleId = 'letme-live-preview-styles';

  applyPreview(selector: string, cssRules: Record<string, string>): { success: boolean; message?: string } {
    try {
      const el = document.querySelector(selector);
      if (!el) {
        return {
          success: false,
          message: `Element matching selector "${selector}" was not found in the DOM.`,
        };
      }

      let styleEl = this.activeStyles.get(selector);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = `letme-preview-${Date.now()}`;
        document.head.appendChild(styleEl);
        this.activeStyles.set(selector, styleEl);
      }

      // Convert cssRules to CSS text with !important to ensure override
      const ruleEntries = Object.entries(cssRules)
        .map(([prop, val]) => `  ${prop}: ${val} !important;`)
        .join('\n');

      const cssContent = `
/* LetMe AI Live Preview for ${selector} */
${selector} {
${ruleEntries}
  outline: 2px dashed #6366f1 !important;
  outline-offset: 2px !important;
  transition: all 0.2s ease-in-out !important;
}
`;

      styleEl.textContent = cssContent;

      // Scroll element gently into view if offscreen
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

      return {
        success: true,
        message: `Applied ${Object.keys(cssRules).length} CSS rules to ${selector}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || String(err),
      };
    }
  }

  clearPreview(selector?: string) {
    if (selector) {
      const styleEl = this.activeStyles.get(selector);
      if (styleEl) {
        styleEl.remove();
        this.activeStyles.delete(selector);
      }
    } else {
      // Clear all
      for (const [, styleEl] of this.activeStyles) {
        styleEl.remove();
      }
      this.activeStyles.clear();
    }
  }

  highlightElement(selector: string, durationMs: number = 3000) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    const originalOutline = el.style.outline;
    const originalOffset = el.style.outlineOffset;

    el.style.outline = '3px solid #10b981';
    el.style.outlineOffset = '2px';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.outlineOffset = originalOffset;
    }, durationMs);
  }
}

export const livePreviewManager = new LivePreviewManager();
