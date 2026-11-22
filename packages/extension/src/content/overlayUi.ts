import { BoxModelMetrics, LayoutBugReport } from '@letme/shared';
import { MarkupStudio, MarkupTool } from './markupStudio.js';

export interface OverlayCallbacks {
  onSendToAi: (instructions: string, bugNotes: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export class OverlayUi {
  private container: HTMLDivElement | null = null;
  private markupStudio: MarkupStudio | null = null;
  private selectedElement: HTMLElement | null = null;
  private callbacks: OverlayCallbacks;

  constructor(callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
  }

  show(
    element: HTMLElement,
    selector: string,
    boxModel: BoxModelMetrics,
    bugs: LayoutBugReport,
    markupStudio: MarkupStudio
  ) {
    this.selectedElement = element;
    this.markupStudio = markupStudio;

    this.remove();

    this.container = document.createElement('div');
    this.container.id = 'letme-inspector-overlay-root';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '24px';
    this.container.style.right = '24px';
    this.container.style.width = '380px';
    this.container.style.maxHeight = '88vh';
    this.container.style.backgroundColor = '#09090b';
    this.container.style.color = '#fafafa';
    this.container.style.borderRadius = '12px';
    this.container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.75)';
    this.container.style.border = '1px solid #27272a';
    this.container.style.zIndex = '2147483647';
    this.container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.container.style.fontSize = '12px';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.overflow = 'hidden';

    // Header
    const header = document.createElement('div');
    header.style.padding = '10px 14px';
    header.style.backgroundColor = '#18181b';
    header.style.borderBottom = '1px solid #27272a';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 700; font-size: 13px; color: #ffffff; letter-spacing: -0.2px;">LetMe Inspector</span>
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 10px; padding: 2px 6px; background: #09090b; border-radius: 9999px; border: 1px solid #27272a;">
          <span id="letme-status-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444;"></span>
          <span id="letme-status-text" style="color: #a1a1aa;">MCP Checking...</span>
        </span>
      </div>
      <button id="letme-btn-close" style="background: none; border: none; color: #71717a; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">✕</button>
    `;
    this.container.appendChild(header);

    // Query MCP status from background
    chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => {
      const isConnected = res?.connected ?? false;
      const dot = this.container?.querySelector('#letme-status-dot') as HTMLElement | null;
      const txt = this.container?.querySelector('#letme-status-text') as HTMLElement | null;
      if (dot && txt) {
        dot.style.background = isConnected ? '#10b981' : '#ef4444';
        txt.innerText = isConnected ? 'MCP Connected' : 'MCP Offline';
      }
    });

    // Body content
    const body = document.createElement('div');
    body.style.padding = '12px 14px';
    body.style.overflowY = 'auto';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '10px';

    // Element Info Card
    const infoCard = document.createElement('div');
    infoCard.style.padding = '8px 10px';
    infoCard.style.backgroundColor = '#18181b';
    infoCard.style.borderRadius = '6px';
    infoCard.style.border = '1px solid #27272a';

    infoCard.innerHTML = `
      <div style="font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; margin-bottom: 4px;">
        &lt;${element.tagName.toLowerCase()}&gt; ${selector}
      </div>
      <div style="display: flex; gap: 10px; font-size: 11px; color: #a1a1aa; font-family: monospace;">
        <span>W×H: <b style="color: #fafafa;">${boxModel.width}×${boxModel.height}px</b></span>
        <span>Pad: ${boxModel.padding.top}/${boxModel.padding.right}/${boxModel.padding.bottom}/${boxModel.padding.left}</span>
        <span>Mar: ${boxModel.margin.top}/${boxModel.margin.right}/${boxModel.margin.bottom}/${boxModel.margin.left}</span>
      </div>
    `;
    body.appendChild(infoCard);

    // Bug / Warnings alert if any
    if (bugs.warnings.length > 0 || bugs.hasHorizontalScrollLeak || bugs.isClippedByAncestor) {
      const bugAlert = document.createElement('div');
      bugAlert.style.padding = '8px 10px';
      bugAlert.style.backgroundColor = '#18181b';
      bugAlert.style.border = '1px solid #ef4444';
      bugAlert.style.borderRadius = '6px';
      bugAlert.style.fontSize = '11px';

      const warningItems = bugs.warnings.map((w) => `<li>${w}</li>`).join('');
      bugAlert.innerHTML = `
        <div style="font-weight: 600; color: #f87171; margin-bottom: 2px;">⚠️ Layout Alert:</div>
        <ul style="margin: 0; padding-left: 16px; color: #fca5a5;">
          ${warningItems}
        </ul>
      `;
      body.appendChild(bugAlert);
    }

    // Markup Tools
    const toolbar = document.createElement('div');
    toolbar.style.padding = '8px 10px';
    toolbar.style.backgroundColor = '#18181b';
    toolbar.style.borderRadius = '6px';
    toolbar.style.border = '1px solid #27272a';
    toolbar.style.display = 'flex';
    toolbar.style.flexWrap = 'wrap';
    toolbar.style.gap = '4px';
    toolbar.style.alignItems = 'center';

    const tools: { id: MarkupTool; label: string; icon: string }[] = [
      { id: 'pen', label: 'Draw', icon: '✏️' },
      { id: 'arrow', label: 'Arrow', icon: '➡️' },
      { id: 'box', label: 'Box', icon: '🔲' },
      { id: 'text', label: 'Text', icon: '💬' },
      { id: 'ruler', label: 'Ruler', icon: '📏' },
      { id: 'blur', label: 'Blur', icon: '🔒' },
    ];

    toolbar.innerHTML = `
      <div id="letme-tools-container" style="display: flex; gap: 4px; flex-wrap: wrap;"></div>
      <div style="margin-left: auto; display: flex; gap: 4px;">
        <button id="letme-btn-undo" title="Undo" style="background: #27272a; border: none; color: #fafafa; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">↩️</button>
        <button id="letme-btn-clear-markup" title="Clear All" style="background: #27272a; border: none; color: #fafafa; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">🧹</button>
      </div>
    `;

    const toolsContainer = toolbar.querySelector('#letme-tools-container')!;
    tools.forEach((t) => {
      const btn = document.createElement('button');
      btn.dataset.tool = t.id;
      btn.innerHTML = `${t.icon} ${t.label}`;
      btn.style.padding = '4px 7px';
      btn.style.fontSize = '11px';
      btn.style.border = '1px solid #27272a';
      btn.style.borderRadius = '4px';
      btn.style.backgroundColor = t.id === 'pen' ? '#fafafa' : '#09090b';
      btn.style.color = t.id === 'pen' ? '#09090b' : '#a1a1aa';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '500';

      btn.addEventListener('click', () => {
        toolbar.querySelectorAll('button[data-tool]').forEach((b: any) => {
          b.style.backgroundColor = '#09090b';
          b.style.color = '#a1a1aa';
          b.style.borderColor = '#27272a';
        });
        btn.style.backgroundColor = '#fafafa';
        btn.style.color = '#09090b';
        btn.style.borderColor = '#ffffff';
        this.markupStudio?.setTool(t.id);
      });

      toolsContainer.appendChild(btn);
    });

    body.appendChild(toolbar);

    // Instruction input
    const formGroup1 = document.createElement('div');
    formGroup1.innerHTML = `
      <label style="display: block; font-size: 11px; font-weight: 500; color: #a1a1aa; margin-bottom: 4px;">
        Desired Styling / Instructions:
      </label>
      <textarea id="letme-input-instructions" placeholder="e.g. Ubah padding jadi 16px, perbaiki background color..."
        style="width: 100%; box-sizing: border-box; height: 44px; background: #18181b; border: 1px solid #27272a; border-radius: 6px; color: #fafafa; padding: 6px 8px; font-size: 12px; resize: vertical; font-family: inherit; outline: none;"></textarea>
    `;
    body.appendChild(formGroup1);

    // Bug notes input
    const formGroup2 = document.createElement('div');
    formGroup2.innerHTML = `
      <label style="display: block; font-size: 11px; font-weight: 500; color: #a1a1aa; margin-bottom: 4px;">
        Reported Bugs / Layout Issues:
      </label>
      <textarea id="letme-input-bugs" placeholder="e.g. Teks terpotong saat mobile, overflow horizontal..."
        style="width: 100%; box-sizing: border-box; height: 38px; background: #18181b; border: 1px solid #27272a; border-radius: 6px; color: #fafafa; padding: 6px 8px; font-size: 12px; resize: vertical; font-family: inherit; outline: none;"></textarea>
    `;
    body.appendChild(formGroup2);

    this.container.appendChild(body);

    // Footer Actions
    const footer = document.createElement('div');
    footer.style.padding = '10px 14px';
    footer.style.backgroundColor = '#18181b';
    footer.style.borderTop = '1px solid #27272a';
    footer.style.display = 'flex';
    footer.style.gap = '8px';
    footer.style.justifyContent = 'flex-end';

    footer.innerHTML = `
      <button id="letme-btn-cancel" style="padding: 6px 12px; background: #18181b; border: 1px solid #27272a; border-radius: 6px; color: #a1a1aa; font-weight: 500; font-size: 11px; cursor: pointer;">Cancel</button>
      <button id="letme-btn-copy-prompt" style="padding: 6px 12px; background: #27272a; border: 1px solid #3f3f46; border-radius: 6px; color: #fafafa; font-weight: 500; font-size: 11px; cursor: pointer;">📋 Copy Prompt</button>
      <button id="letme-btn-send" style="padding: 6px 14px; background: #fafafa; border: none; border-radius: 6px; color: #09090b; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px;">
        <span>🚀 Send to AI</span>
      </button>
    `;
    this.container.appendChild(footer);

    document.body.appendChild(this.container);

    // Event listeners
    this.container.querySelector('#letme-btn-close')?.addEventListener('click', () => this.callbacks.onClose());
    this.container.querySelector('#letme-btn-cancel')?.addEventListener('click', () => this.callbacks.onClose());
    this.container.querySelector('#letme-btn-undo')?.addEventListener('click', () => this.markupStudio?.undo());
    this.container.querySelector('#letme-btn-clear-markup')?.addEventListener('click', () => this.markupStudio?.clear());

    this.container.querySelector('#letme-btn-copy-prompt')?.addEventListener('click', () => {
      const instructions = (this.container?.querySelector('#letme-input-instructions') as HTMLTextAreaElement)?.value || '';
      const bugNotes = (this.container?.querySelector('#letme-input-bugs') as HTMLTextAreaElement)?.value || '';
      const promptText = `### 🎯 Element: <${element.tagName.toLowerCase()}> \`${selector}\`\n- **Size**: ${boxModel.width}x${boxModel.height}px\n- **Instructions**: ${instructions || 'N/A'}\n- **Bugs**: ${bugNotes || 'N/A'}`;
      navigator.clipboard.writeText(promptText);
      this.showToast('📋 Prompt copied to clipboard!');
    });

    this.container.querySelector('#letme-btn-send')?.addEventListener('click', () => {
      const instructions = (this.container?.querySelector('#letme-input-instructions') as HTMLTextAreaElement)?.value || '';
      const bugNotes = (this.container?.querySelector('#letme-input-bugs') as HTMLTextAreaElement)?.value || '';
      this.callbacks.onSendToAi(instructions, bugNotes);
    });
  }

  showToast(message: string, isError: boolean = false) {
    const existing = document.getElementById('letme-toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'letme-toast-msg';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = isError ? '#450a0a' : '#09090b';
    toast.style.border = `1px solid ${isError ? '#ef4444' : '#27272a'}`;
    toast.style.color = isError ? '#fca5a5' : '#fafafa';
    toast.style.padding = '8px 16px';
    toast.style.borderRadius = '9999px';
    toast.style.zIndex = '2147483647';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '12px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.innerText = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  remove() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
