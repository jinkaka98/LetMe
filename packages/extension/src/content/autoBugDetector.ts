export interface DetectedBug {
  id: number | string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'suggestion';
  fix?: string;
}

export interface ResolvedBugBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  docX: number;
  docY: number;
  elementTag?: string;
  elementSelector?: string;
  targetElement?: HTMLElement | null;
}

export function normalizeChatCompletionsUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  // Auto-prepend https:// if protocol is omitted (prevents browser resolving as relative path)
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith('localhost') || url.startsWith('127.0.0.1')) {
      url = `http://${url}`;
    } else {
      url = `https://${url}`;
    }
  }
  url = url.replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  return `${url}/chat/completions`;
}

export class AutoBugDetector {
  private activePins: HTMLElement[] = [];
  private isLoading: boolean = false;
  private currentBugs: DetectedBug[] = [];
  private currentScreenshot: string = '';
  private activeFilter: 'all' | 'critical' | 'warning' | 'suggestion' = 'all';
  private resolvedBoundsMap: Map<number, ResolvedBugBounds> = new Map();
  private scrollListenerAttached: boolean = false;
  private rAFScheduled: boolean = false;

  async runDetection() {
    if (this.isLoading) return;

    // Check settings
    const config = await chrome.storage.local.get(['aiBaseUrl', 'aiApiKey', 'aiModel', 'aiProvider']);
    const provider = config.aiProvider || 'openrouter';
    const baseUrl = config.aiBaseUrl || (provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://openrouter.ai/api/v1');
    const apiKey = config.aiApiKey;
    const model = config.aiModel || (provider === 'gemini' ? 'gemini-2.0-flash' : 'google/gemini-2.0-flash-001');

    if (!apiKey && provider !== 'ollama') {
      this.showModalAlert(
        'AI Configuration Required',
        'AI Vision Auto Bug Detection requires an API Key.\n\n' +
        'Please open the LetMe extension popup > Settings tab (⚙️) to select your AI provider (e.g. Google Gemini, OpenRouter, OpenAI, Groq) and enter your API Key.'
      );
      return;
    }

    // Safety check: Prevent targeting user's own web app port (e.g. 28120) without /v1
    if (baseUrl.includes(':28120') && !baseUrl.includes('/v1')) {
      this.showModalAlert(
        'Invalid AI Vision Base URL',
        `Base URL "${baseUrl}" points to your local web dashboard (Alpakyros) instead of an AI Vision LLM endpoint.\n\n` +
        'How to fix:\n' +
        '1. Click the LetMe extension icon\n' +
        '2. Click ⚙️ (Settings)\n' +
        '3. Select an AI Provider (e.g. Google Gemini or OpenRouter)\n' +
        '4. Paste your API Key and click "Save Settings".'
      );
      return;
    }

    this.clearPins();
    this.showScanningHUD('Initializing AI Vision Scanner...');

    try {
      // 1. Capture viewport screenshot
      this.updateScanningStage('📸 Capturing High-Res Viewport Snapshot...');
      const shotRes = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      const dataUrl: string = shotRes?.dataUrl || '';
      if (!dataUrl) throw new Error('Could not capture viewport for AI vision analysis.');
      this.currentScreenshot = dataUrl;

      // 2. Call OpenAI-compatible vision endpoint
      const endpoint = normalizeChatCompletionsUrl(baseUrl);
      this.updateScanningStage(`🧠 AI Vision (${model}) Analyzing Layout & Alignment...`);

      const promptSystem = `You are an elite Frontend UI/UX and QA Engineer. Analyze the screenshot of this webpage to spot visual bugs, layout leaks, broken flex/grid wrapping, text clipping/overflow, unreadable contrast, stray elements, or misaligned elements.
Return ONLY a valid JSON array of detected visual bugs matching this exact TypeScript interface:
Array<{
  id: number;
  x: number; // pixel position from left
  y: number; // pixel position from top
  width: number; // approximate bug bounding box width
  height: number; // approximate bug bounding box height
  title: string; // short bug title
  description: string; // concise explanation of the bug
  severity: "critical" | "warning" | "suggestion";
  fix: string; // concrete CSS or layout advice to fix it
}>`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Delegate HTTP request to Background Service Worker (bypasses webpage CORS restrictions)
      const proxyRes: { ok: boolean; status: number; text?: string; error?: string } = await chrome.runtime.sendMessage({
        type: 'PROXY_AI_REQUEST',
        payload: {
          endpoint,
          headers,
          body: {
            model,
            messages: [
              { role: 'system', content: promptSystem },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Analyze this webpage (${window.innerWidth}px x ${window.innerHeight}px). Page title: "${document.title}". Spot visual bugs, alignment issues, layout overflow, or clipping. Return ONLY JSON array.`,
                  },
                  {
                    type: 'image_url',
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ],
            temperature: 0.2,
          },
        },
      });

      if (!proxyRes) {
        throw new Error('Background proxy service is unavailable. Please reload the extension.');
      }

      const rawText = proxyRes.text || '';

      if (!proxyRes.ok) {
        if (proxyRes.error) {
          throw new Error(`Connection error: ${proxyRes.error}`);
        }
        if (proxyRes.status === 405) {
          throw new Error(
            `Endpoint returned HTTP 405 (Method Not Allowed).\n\n` +
            `"${endpoint}" does not support POST /chat/completions.\n\n` +
            `Please configure a valid AI Vision provider (e.g. Google Gemini, OpenRouter, OpenAI, Groq, or Ollama) in LetMe Settings ⚙️.`
          );
        }
        if (proxyRes.status === 404) {
          throw new Error(
            `Endpoint returned HTTP 404 (Not Found) at "${endpoint}".\n\n` +
            `Please verify your AI Base URL in LetMe Settings ⚙️.`
          );
        }
        if (proxyRes.status === 401 || proxyRes.status === 403) {
          throw new Error(
            `Authentication failed (HTTP ${proxyRes.status}).\n\n` +
            `Your API Key appears to be invalid or unauthorized. Please verify your API Key in Settings ⚙️.`
          );
        }
        throw new Error(`API Error (${proxyRes.status}): ${rawText}`);
      }

      // Detect HTML response (e.g. SPA fallback, Cloudflare challenge, or standard webpage)
      if (rawText.trim().startsWith('<')) {
        throw new Error(
          `The endpoint "${endpoint}" returned an HTML webpage instead of a JSON API response.\n\n` +
          `Possible causes:\n` +
          `1. Base URL was typed without "https://" (e.g. "sv4.alpakyros.com/v1" instead of "https://sv4.alpakyros.com/v1").\n` +
          `2. Base URL points to a frontend web app rather than an AI LLM gateway.\n\n` +
          `Please update your Base URL in Settings ⚙️.`
        );
      }

      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(
          `The endpoint "${endpoint}" did not return valid JSON.\n\n` +
          `Response excerpt: ${rawText.slice(0, 200)}`
        );
      }

      const content = json.choices?.[0]?.message?.content || '';

      // Parse JSON from output (strip markdown backticks if any)
      const cleanJson = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      let bugs: DetectedBug[] = [];
      try {
        bugs = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn('[LetMe AutoBug] Failed to parse raw JSON:', content);
        throw new Error('AI Vision model did not return a valid JSON array format.');
      }

      this.updateScanningStage(`🎯 Mapping ${bugs.length} detected visual issues & elements...`);
      await new Promise((r) => setTimeout(r, 400));
      this.hideScanningHUD();

      if (!Array.isArray(bugs) || bugs.length === 0) {
        this.showToast('✅ AI Vision Analysis Complete: No visual bugs found!');
        return;
      }

      this.currentBugs = bugs;
      this.renderBugPins(bugs);
      this.renderFloatingDrawer(bugs, dataUrl);
      this.showToast(`🎯 Found ${bugs.length} visual issues! Check the highlighted elements & report drawer.`);
    } catch (err: any) {
      this.hideScanningHUD();
      console.error('[LetMe AutoBug] Error:', err);
      this.showModalAlert('Auto Bug Detection Failed', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Futuristic Scanning Visualization HUD
  // ─────────────────────────────────────────────────────────────
  private showScanningHUD(initialStage: string) {
    this.isLoading = true;
    this.hideScanningHUD();

    // Inject CSS Keyframes if missing
    if (!document.getElementById('letme-scanner-styles')) {
      const style = document.createElement('style');
      style.id = 'letme-scanner-styles';
      style.textContent = `
        @keyframes letmeScanBeam {
          0% { top: 0%; opacity: 0.9; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0.9; }
        }
        @keyframes letmeRadarPulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes letmeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes letmePinPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    const hudRoot = document.createElement('div');
    hudRoot.id = 'letme-scanner-hud';
    hudRoot.className = 'letme-ui-root';
    hudRoot.style.position = 'fixed';
    hudRoot.style.top = '0';
    hudRoot.style.left = '0';
    hudRoot.style.width = '100vw';
    hudRoot.style.height = '100vh';
    hudRoot.style.pointerEvents = 'none';
    hudRoot.style.zIndex = '2147483646';
    hudRoot.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // 1. Cyber Laser Beam
    const beam = document.createElement('div');
    beam.style.position = 'absolute';
    beam.style.left = '0';
    beam.style.width = '100%';
    beam.style.height = '3px';
    beam.style.background = 'linear-gradient(90deg, transparent, #38bdf8 20%, #ffffff 50%, #38bdf8 80%, transparent)';
    beam.style.boxShadow = '0 0 15px #38bdf8, 0 0 30px rgba(56, 189, 248, 0.7)';
    beam.style.animation = 'letmeScanBeam 2.4s ease-in-out infinite alternate';

    const beamTrail = document.createElement('div');
    beamTrail.style.width = '100%';
    beamTrail.style.height = '70px';
    beamTrail.style.background = 'linear-gradient(180deg, rgba(56, 189, 248, 0.12) 0%, transparent 100%)';
    beam.appendChild(beamTrail);
    hudRoot.appendChild(beam);

    // 2. Center Top HUD Card
    const card = document.createElement('div');
    card.style.position = 'absolute';
    card.style.top = '24px';
    card.style.left = '50%';
    card.style.transform = 'translateX(-50%)';
    card.style.backgroundColor = 'rgba(9, 9, 11, 0.95)';
    card.style.backdropFilter = 'blur(10px)';
    card.style.border = '1px solid #38bdf8';
    card.style.borderRadius = '9999px';
    card.style.padding = '8px 22px';
    card.style.color = '#fafafa';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.25)';
    card.style.pointerEvents = 'auto';

    card.innerHTML = `
      <span style="display:inline-block; animation: letmeSpin 1.4s linear infinite; font-size:16px;">📡</span>
      <div style="display:flex; flex-direction:column;">
        <span style="font-size:11px; font-weight:800; letter-spacing:0.8px; text-transform:uppercase; color:#fafafa;">AI VISION SCANNER</span>
        <span id="letme-scanner-stage-text" style="font-size:12px; color:#38bdf8; font-weight:500;">${initialStage}</span>
      </div>
      <button id="letme-scanner-cancel" style="background:#18181b; border:1px solid #27272a; color:#a1a1aa; padding:4px 10px; border-radius:9999px; font-size:11px; font-weight:600; cursor:pointer; margin-left:8px; transition: all 0.15s;">
        Cancel ✕
      </button>
    `;

    card.querySelector('#letme-scanner-cancel')?.addEventListener('click', () => {
      this.hideScanningHUD();
      this.showToast('AI Vision scan canceled.');
    });

    hudRoot.appendChild(card);
    document.body.appendChild(hudRoot);
  }

  private updateScanningStage(stage: string) {
    const textEl = document.getElementById('letme-scanner-stage-text');
    if (textEl) {
      textEl.innerText = stage;
    }
  }

  private hideScanningHUD() {
    this.isLoading = false;
    document.getElementById('letme-scanner-hud')?.remove();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Intelligent DOM Element Snapping & Bounds Resolution
  // ─────────────────────────────────────────────────────────────
  private resolveBugBounds(bug: DetectedBug): ResolvedBugBounds {
    // 1. Try DOM element sniffing at the exact coordinate
    let targetEl: HTMLElement | null = null;
    try {
      const elements = document.elementsFromPoint(bug.x, bug.y);
      for (const el of elements) {
        if (el instanceof HTMLElement) {
          if (
            el.tagName === 'BODY' ||
            el.tagName === 'HTML' ||
            el.closest('.letme-ui-root') ||
            el.closest('.letme-autobug-element') ||
            el.id?.startsWith('letme-') ||
            el.className?.includes?.('letme-')
          ) {
            continue;
          }
          targetEl = el;
          break;
        }
      }
    } catch {}

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      // Ensure element has meaningful dimensions and isn't the entire viewport
      if (
        rect.width >= 6 &&
        rect.height >= 6 &&
        rect.width <= window.innerWidth * 0.95 &&
        rect.height <= window.innerHeight * 0.95
      ) {
        const tag = targetEl.tagName.toLowerCase();
        const idStr = targetEl.id ? `#${targetEl.id}` : '';
        const firstClass = targetEl.classList[0] ? `.${targetEl.classList[0]}` : '';
        const selector = `${tag}${idStr || firstClass}`;
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          docX: Math.round(rect.left + window.scrollX),
          docY: Math.round(rect.top + window.scrollY),
          elementTag: `<${tag}${idStr || firstClass}>`,
          elementSelector: selector,
          targetElement: targetEl,
        };
      }
    }

    // 2. Fallback to AI-provided bounding box if provided
    const fallbackX = Math.round(Math.max(0, bug.x));
    const fallbackY = Math.round(Math.max(0, bug.y));
    const w = (bug.width && bug.width > 10) ? Math.round(bug.width) : 140;
    const h = (bug.height && bug.height > 10) ? Math.round(bug.height) : 48;
    return {
      x: fallbackX,
      y: fallbackY,
      width: w,
      height: h,
      docX: fallbackX + window.scrollX,
      docY: fallbackY + window.scrollY,
      elementTag: 'area',
      targetElement: null,
    };
  }

  // Dynamic 60fps Scroll/Resize Synchronization
  private handleScrollOrResize = () => {
    if (this.rAFScheduled) return;
    this.rAFScheduled = true;
    requestAnimationFrame(() => {
      this.rAFScheduled = false;
      this.repositionAllPinsAndBoxes();
    });
  };

  private repositionAllPinsAndBoxes() {
    this.resolvedBoundsMap.forEach((bounds, index) => {
      const box = document.getElementById(`letme-bug-box-${index}`);
      const pin = document.getElementById(`letme-bug-pin-${index}`);

      let curX: number;
      let curY: number;
      let curW: number;
      let curH: number;

      if (bounds.targetElement && bounds.targetElement.isConnected) {
        const rect = bounds.targetElement.getBoundingClientRect();
        curX = Math.round(rect.left);
        curY = Math.round(rect.top);
        curW = Math.round(rect.width);
        curH = Math.round(rect.height);
      } else {
        curX = Math.round(bounds.docX - window.scrollX);
        curY = Math.round(bounds.docY - window.scrollY);
        curW = bounds.width;
        curH = bounds.height;
      }

      if (box) {
        box.style.left = `${curX}px`;
        box.style.top = `${curY}px`;
        box.style.width = `${curW}px`;
        box.style.height = `${curH}px`;
      }

      if (pin) {
        pin.style.left = `${curX}px`;
        pin.style.top = `${curY - 28}px`;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. High-Visibility Element Highlight Boxes & Pin Badges
  // ─────────────────────────────────────────────────────────────
  private renderBugPins(bugs: DetectedBug[]) {
    this.resolvedBoundsMap.clear();

    // Attach capture-phase scroll listener so inner container and page scrolls are caught
    if (!this.scrollListenerAttached) {
      window.addEventListener('scroll', this.handleScrollOrResize, { passive: true, capture: true });
      window.addEventListener('resize', this.handleScrollOrResize, { passive: true });
      this.scrollListenerAttached = true;
    }

    bugs.forEach((bug, index) => {
      const bounds = this.resolveBugBounds(bug);
      this.resolvedBoundsMap.set(index, bounds);

      const color = bug.severity === 'critical' ? '#ef4444' : bug.severity === 'warning' ? '#f59e0b' : '#38bdf8';
      const bgTint = bug.severity === 'critical' ? 'rgba(239, 68, 68, 0.14)' : bug.severity === 'warning' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(56, 189, 248, 0.14)';
      const shadowColor = bug.severity === 'critical' ? 'rgba(239, 68, 68, 0.35)' : bug.severity === 'warning' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)';

      // 1. Prominent High-Contrast Element Bounding Box (Always Drawn for EVERY Bug!)
      // NOTE: Transition MUST NOT animate top or left, ensuring instant 0ms latency on scroll!
      const box = document.createElement('div');
      box.id = `letme-bug-box-${index}`;
      box.className = 'letme-autobug-element letme-ui-root';
      box.style.position = 'fixed';
      box.style.left = `${bounds.x}px`;
      box.style.top = `${bounds.y}px`;
      box.style.width = `${bounds.width}px`;
      box.style.height = `${bounds.height}px`;
      box.style.border = `2px solid ${color}`;
      box.style.borderRadius = '6px';
      box.style.backgroundColor = bgTint;
      box.style.boxShadow = `0 0 12px ${shadowColor}, inset 0 0 12px ${bgTint}`;
      box.style.zIndex = '2147483640';
      box.style.pointerEvents = 'auto';
      box.style.cursor = 'pointer';
      box.style.transition = 'background-color 0.15s, box-shadow 0.15s, transform 0.15s';

      // Corner reticles for high-precision DevTools feel + Tag Badge
      box.innerHTML = `
        <div style="position:absolute; top:-2px; left:-2px; width:7px; height:7px; border-top:3px solid #ffffff; border-left:3px solid #ffffff; pointer-events:none;"></div>
        <div style="position:absolute; top:-2px; right:-2px; width:7px; height:7px; border-top:3px solid #ffffff; border-right:3px solid #ffffff; pointer-events:none;"></div>
        <div style="position:absolute; bottom:-2px; left:-2px; width:7px; height:7px; border-bottom:3px solid #ffffff; border-left:3px solid #ffffff; pointer-events:none;"></div>
        <div style="position:absolute; bottom:-2px; right:-2px; width:7px; height:7px; border-bottom:3px solid #ffffff; border-right:3px solid #ffffff; pointer-events:none;"></div>
        ${bounds.elementTag ? `
          <div style="position:absolute; bottom:-20px; left:2px; font-size:9px; font-weight:700; color:#fafafa; background:#09090b; border:1px solid #27272a; padding:1px 6px; border-radius:3px; white-space:nowrap; pointer-events:none; font-family:monospace; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
            ${bounds.elementTag}
          </div>
        ` : ''}
      `;

      box.addEventListener('mouseenter', () => {
        box.style.backgroundColor = 'rgba(239, 68, 68, 0.28)';
        box.style.boxShadow = `0 0 24px ${color}`;
      });
      box.addEventListener('mouseleave', () => {
        box.style.backgroundColor = bgTint;
        box.style.boxShadow = `0 0 12px ${shadowColor}, inset 0 0 12px ${bgTint}`;
      });

      box.addEventListener('click', () => {
        this.focusBugCardInDrawer(index);
        this.highlightPin(index);
      });

      document.body.appendChild(box);
      this.activePins.push(box);

      // 2. Interactive Pin badge attached directly on top of the box
      const pin = document.createElement('div');
      pin.id = `letme-bug-pin-${index}`;
      pin.className = 'letme-autobug-element letme-ui-root';
      pin.style.position = 'fixed';
      pin.style.left = `${bounds.x}px`;
      pin.style.top = `${bounds.y - 28}px`;
      pin.style.zIndex = '2147483645';
      pin.style.cursor = 'pointer';
      pin.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      pin.style.transition = 'transform 0.15s ease-out';

      pin.innerHTML = `
        <div style="display: flex; align-items: center; gap: 5px; background: #09090b; border: 1.5px solid ${color}; padding: 3px 9px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.7); color: #fafafa; font-size: 11px; font-weight: 700;">
          <span style="color: ${color};">⚠️ #${index + 1}</span>
          <span style="max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${bug.title}</span>
        </div>
      `;

      pin.addEventListener('click', () => {
        this.focusBugCardInDrawer(index);
        this.highlightPin(index);
      });

      document.body.appendChild(pin);
      this.activePins.push(pin);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Floating Report Drawer (Bottom-Right HUD)
  // ─────────────────────────────────────────────────────────────
  private renderFloatingDrawer(bugs: DetectedBug[], screenshotDataUrl: string) {
    document.getElementById('letme-bug-drawer')?.remove();

    const drawer = document.createElement('div');
    drawer.id = 'letme-bug-drawer';
    drawer.className = 'letme-ui-root';
    drawer.style.position = 'fixed';
    drawer.style.bottom = '20px';
    drawer.style.right = '20px';
    drawer.style.width = '420px';
    drawer.style.maxWidth = 'calc(100vw - 40px)';
    drawer.style.maxHeight = '620px';
    drawer.style.backgroundColor = '#09090b';
    drawer.style.border = '1px solid #27272a';
    drawer.style.borderRadius = '14px';
    drawer.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.85), 0 0 20px rgba(0,0,0,0.5)';
    drawer.style.zIndex = '2147483647';
    drawer.style.display = 'flex';
    drawer.style.flexDirection = 'column';
    drawer.style.overflow = 'hidden';
    drawer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    drawer.style.color = '#fafafa';

    const criticalCount = bugs.filter((b) => b.severity === 'critical').length;
    const warningCount = bugs.filter((b) => b.severity === 'warning').length;
    const suggestionCount = bugs.filter((b) => b.severity === 'suggestion').length;

    drawer.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #18181b; background:#121215;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">🤖</span>
          <span style="font-size:13px; font-weight:700; color:#fafafa;">AI Bug Report</span>
          <span style="background:#27272a; color:#fafafa; font-size:10px; font-weight:700; padding:2px 7px; border-radius:9999px;">
            ${bugs.length} Issues
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="letme-drawer-minimize" title="Minimize drawer" style="background:none; border:1px solid #27272a; color:#a1a1aa; border-radius:6px; width:26px; height:26px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px;">−</button>
          <button id="letme-drawer-close" title="Dismiss all pins" style="background:none; border:1px solid #27272a; color:#a1a1aa; border-radius:6px; width:26px; height:26px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px;">✕</button>
        </div>
      </div>

      <!-- Severity Filters -->
      <div style="display:flex; gap:6px; padding:10px 16px; border-bottom:1px solid #18181b; background:#09090b; font-size:11px;">
        <button class="letme-filter-btn active" data-filter="all" style="background:#27272a; border:none; color:#fafafa; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
          All (${bugs.length})
        </button>
        ${criticalCount > 0 ? `
          <button class="letme-filter-btn" data-filter="critical" style="background:#18181b; border:1px solid #ef4444; color:#ef4444; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Critical (${criticalCount})
          </button>
        ` : ''}
        ${warningCount > 0 ? `
          <button class="letme-filter-btn" data-filter="warning" style="background:#18181b; border:1px solid #f59e0b; color:#f59e0b; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Warning (${warningCount})
          </button>
        ` : ''}
        ${suggestionCount > 0 ? `
          <button class="letme-filter-btn" data-filter="suggestion" style="background:#18181b; border:1px solid #38bdf8; color:#38bdf8; padding:4px 9px; border-radius:9999px; font-weight:600; cursor:pointer;">
            Suggestion (${suggestionCount})
          </button>
        ` : ''}
      </div>

      <!-- Bug Cards Container -->
      <div id="letme-drawer-list" style="overflow-y:auto; max-height:360px; padding:12px 16px; display:flex; flex-direction:column; gap:10px; background:#09090b;">
        <!-- Filled by renderBugCardsIntoContainer() -->
      </div>

      <!-- Action Footer -->
      <div style="padding:12px 16px; border-top:1px solid #18181b; background:#121215; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; gap:8px;">
          <button id="letme-btn-copy-all" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#18181b; border:1px solid #27272a; color:#fafafa; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s;">
            📋 Copy All (Markdown)
          </button>
          <button id="letme-btn-sync-all-mcp" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#fafafa; border:none; color:#09090b; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; transition:opacity 0.15s;">
            ⚡ Send All to MCP
          </button>
        </div>
        <button id="letme-btn-clear-all" style="background:none; border:none; color:#71717a; font-size:11px; cursor:pointer; text-align:center;">
          Clear All ${bugs.length} Pins & Close
        </button>
      </div>
    `;

    document.body.appendChild(drawer);
    this.activePins.push(drawer);

    // Initial render of cards
    this.renderBugCardsIntoContainer(bugs);

    // Filter Buttons
    drawer.querySelectorAll('.letme-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const filter = target.getAttribute('data-filter') as any;
        this.activeFilter = filter;
        drawer.querySelectorAll('.letme-filter-btn').forEach((b) => {
          (b as HTMLElement).style.background = '#18181b';
          (b as HTMLElement).style.color = '#a1a1aa';
        });
        target.style.background = '#27272a';
        target.style.color = '#fafafa';
        this.renderBugCardsIntoContainer(bugs);
      });
    });

    // Minimize & Restore
    drawer.querySelector('#letme-drawer-minimize')?.addEventListener('click', () => {
      drawer.style.display = 'none';
      this.showMinimizedPill(bugs.length);
    });

    // Close & Clear
    drawer.querySelector('#letme-drawer-close')?.addEventListener('click', () => {
      this.clearPins();
    });
    drawer.querySelector('#letme-btn-clear-all')?.addEventListener('click', () => {
      this.clearPins();
    });

    // Copy All (Markdown)
    drawer.querySelector('#letme-btn-copy-all')?.addEventListener('click', () => {
      this.copyAllBugsMarkdown(bugs);
    });

    // Send All to MCP
    drawer.querySelector('#letme-btn-sync-all-mcp')?.addEventListener('click', () => {
      this.syncAllBugsToMcp(bugs, screenshotDataUrl);
    });
  }

  private renderBugCardsIntoContainer(bugs: DetectedBug[]) {
    const container = document.getElementById('letme-drawer-list');
    if (!container) return;
    container.innerHTML = '';

    const filtered = this.activeFilter === 'all'
      ? bugs
      : bugs.filter((b) => b.severity === this.activeFilter);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="padding:20px; text-align:center; color:#71717a; font-size:12px;">
          No bugs found under "${this.activeFilter}" filter.
        </div>
      `;
      return;
    }

    filtered.forEach((bug) => {
      const origIndex = bugs.indexOf(bug);
      const bounds = this.resolvedBoundsMap.get(origIndex);
      const color = bug.severity === 'critical' ? '#ef4444' : bug.severity === 'warning' ? '#f59e0b' : '#38bdf8';

      const card = document.createElement('div');
      card.id = `letme-drawer-card-${origIndex}`;
      card.style.backgroundColor = '#121215';
      card.style.border = `1px solid #27272a`;
      card.style.borderLeft = `3.5px solid ${color}`;
      card.style.borderRadius = '8px';
      card.style.padding = '10px 12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '6px';
      card.style.cursor = 'pointer';
      card.style.transition = 'all 0.15s';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:700; color:#fafafa;">#${origIndex + 1} ${bug.title}</span>
          <span style="font-size:9px; font-weight:800; text-transform:uppercase; padding:2px 6px; border-radius:4px; background:${color}; color:#000;">
            ${bug.severity}
          </span>
        </div>
        <p style="font-size:12px; color:#d4d4d8; line-height:1.45; margin:0;">${bug.description}</p>
        ${bug.fix ? `
          <div style="background:#18181b; border:1px solid #27272a; border-radius:6px; padding:6px 8px; font-size:11px;">
            <span style="color:#a1a1aa; font-weight:600;">💡 Fix: </span>
            <span style="color:#38bdf8; font-family:monospace;">${bug.fix}</span>
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
          <span style="font-size:10px; color:#71717a; font-family:monospace;">
            ${bounds?.elementTag ? `🎯 ${bounds.elementTag} ` : ''}📍 (${bounds?.width || bug.width || 0}×${bounds?.height || bug.height || 0}px)
          </span>
          <span style="font-size:11px; color:#38bdf8; font-weight:600;">Focus Element ↗</span>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        card.style.backgroundColor = '#18181b';
        card.style.borderColor = '#3f3f46';
        const box = document.getElementById(`letme-bug-box-${origIndex}`);
        if (box) {
          box.style.borderWidth = '3px';
          box.style.boxShadow = `0 0 20px ${color}`;
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.backgroundColor = '#121215';
        card.style.borderColor = '#27272a';
        const box = document.getElementById(`letme-bug-box-${origIndex}`);
        if (box) {
          box.style.borderWidth = '2px';
          box.style.boxShadow = '';
        }
      });

      card.addEventListener('click', () => {
        this.scrollToBug(origIndex);
        this.highlightPin(origIndex);
      });

      container.appendChild(card);
    });
  }

  private showMinimizedPill(totalBugs: number) {
    document.getElementById('letme-bug-minimized-pill')?.remove();

    const pill = document.createElement('div');
    pill.id = 'letme-bug-minimized-pill';
    pill.className = 'letme-ui-root';
    pill.style.position = 'fixed';
    pill.style.bottom = '20px';
    pill.style.right = '20px';
    pill.style.backgroundColor = '#09090b';
    pill.style.border = '1px solid #38bdf8';
    pill.style.borderRadius = '9999px';
    pill.style.padding = '8px 16px';
    pill.style.color = '#fafafa';
    pill.style.fontSize = '12px';
    pill.style.fontWeight = '700';
    pill.style.boxShadow = '0 10px 25px rgba(0,0,0,0.7), 0 0 15px rgba(56, 189, 248, 0.3)';
    pill.style.cursor = 'pointer';
    pill.style.zIndex = '2147483647';
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.gap = '8px';
    pill.innerHTML = `
      <span>🤖</span>
      <span>${totalBugs} Visual Bugs</span>
      <span style="background:#18181b; border:1px solid #27272a; padding:2px 8px; border-radius:9999px; font-size:10px; color:#38bdf8;">Expand ↑</span>
    `;

    pill.addEventListener('click', () => {
      pill.remove();
      const drawer = document.getElementById('letme-bug-drawer');
      if (drawer) {
        drawer.style.display = 'flex';
      }
    });

    document.body.appendChild(pill);
    this.activePins.push(pill);
  }

  private scrollToBug(index: number) {
    const bounds = this.resolvedBoundsMap.get(index);
    if (bounds) {
      window.scrollTo({
        top: Math.max(0, bounds.y - 140),
        left: Math.max(0, bounds.x - 100),
        behavior: 'smooth',
      });
    }
  }

  private highlightPin(index: number) {
    const pin = document.getElementById(`letme-bug-pin-${index}`);
    const box = document.getElementById(`letme-bug-box-${index}`);

    if (pin) {
      pin.style.animation = 'letmePinPulse 1.2s ease-out';
      setTimeout(() => {
        pin.style.animation = '';
      }, 1300);
    }

    if (box) {
      const color = this.currentBugs[index]?.severity === 'critical' ? '#ef4444' : this.currentBugs[index]?.severity === 'warning' ? '#f59e0b' : '#38bdf8';
      box.style.border = `3px solid #ffffff`;
      box.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      box.style.boxShadow = `0 0 30px ${color}, 0 0 12px #ffffff`;
      box.style.transform = 'scale(1.03)';
      setTimeout(() => {
        box.style.border = `2px solid ${color}`;
        box.style.backgroundColor = '';
        box.style.boxShadow = '';
        box.style.transform = '';
      }, 1500);
    }
  }

  private focusBugCardInDrawer(index: number) {
    const drawer = document.getElementById('letme-bug-drawer');
    if (drawer && drawer.style.display === 'none') {
      drawer.style.display = 'flex';
      document.getElementById('letme-bug-minimized-pill')?.remove();
    }
    const card = document.getElementById(`letme-drawer-card-${index}`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      card.style.backgroundColor = '#27272a';
      setTimeout(() => {
        card.style.backgroundColor = '#121215';
      }, 1000);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Copy All (Markdown) & Send All to MCP
  // ─────────────────────────────────────────────────────────────
  private copyAllBugsMarkdown(bugs: DetectedBug[]) {
    const lines: string[] = [];
    lines.push(`# 🤖 LetMe AI Vision Bug Report`);
    lines.push(`- **Page Title**: ${document.title}`);
    lines.push(`- **URL**: ${window.location.href}`);
    lines.push(`- **Viewport**: ${window.innerWidth}px × ${window.innerHeight}px`);
    lines.push(`- **Timestamp**: ${new Date().toISOString()}`);
    lines.push(`- **Total Issues Found**: ${bugs.length}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    bugs.forEach((b, i) => {
      const bounds = this.resolvedBoundsMap.get(i);
      const severityEmoji = b.severity === 'critical' ? '🔴' : b.severity === 'warning' ? '🟡' : '🔵';
      lines.push(`### ${i + 1}. ${severityEmoji} [${b.severity.toUpperCase()}] ${b.title}`);
      if (bounds?.elementSelector) {
        lines.push(`- **Target DOM Element**: \`${bounds.elementSelector}\``);
      }
      lines.push(`- **Bounding Box**: x: ${bounds?.x ?? b.x}px, y: ${bounds?.y ?? b.y}px, size: ${bounds?.width ?? b.width ?? 'auto'}px × ${bounds?.height ?? b.height ?? 'auto'}px`);
      lines.push(`- **Problem**: ${b.description}`);
      if (b.fix) {
        lines.push(`- **💡 Suggested Fix**: \`${b.fix}\``);
      }
      lines.push('');
    });

    lines.push('---');
    lines.push(`*Generated automatically by LetMe AI Vision Inspector for Coding Agents (Antigravity / Cursor / Claude).*`);

    const markdown = lines.join('\n');
    navigator.clipboard.writeText(markdown).then(() => {
      this.showToast(`📋 Copied all ${bugs.length} bug reports to clipboard! Ready to paste to AI.`);
    });
  }

  private async syncAllBugsToMcp(bugs: DetectedBug[], screenshotDataUrl: string) {
    // Format full report for the active element
    const fullMarkdownNotes = bugs
      .map((b, i) => {
        const bounds = this.resolvedBoundsMap.get(i);
        const elText = bounds?.elementSelector ? ` [${bounds.elementSelector}]` : '';
        return `${i + 1}. [${b.severity.toUpperCase()}]${elText} ${b.title}: ${b.description} (Fix: ${b.fix || 'N/A'})`;
      })
      .join('\n\n');

    // Send single consolidated master inspection to MCP active element
    await chrome.runtime.sendMessage({
      type: 'ELEMENT_CAPTURED',
      payload: {
        id: `ai_bugs_${Date.now()}`,
        timestamp: Date.now(),
        url: window.location.href,
        pageTitle: document.title,
        selector: `body [AI-Vision-Scan: ${bugs.length} Issues]`,
        tagName: 'AI-VISION-BUG-REPORT',
        classNames: ['letme-ai-bug-report'],
        outerHtmlSnippet: `<!-- AI Vision Scan: ${bugs.length} Visual Defects Found on ${document.title} -->`,
        boxModel: {
          width: window.innerWidth,
          height: window.innerHeight,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          border: { top: 0, right: 0, bottom: 0, left: 0 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          content: { width: window.innerWidth, height: window.innerHeight },
          boundingBox: {
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
        layoutContext: {
          parentTagName: 'html',
          parentSelector: 'html',
          display: 'block',
          position: 'static',
          isFlexChild: false,
          isGridChild: false,
        },
        layoutBugs: {
          hasHorizontalScrollLeak: document.documentElement.scrollWidth > window.innerWidth,
          isClippedByAncestor: false,
          hasZIndexConflict: false,
          zIndex: 'auto',
          warnings: bugs.map((b) => `[${b.severity.toUpperCase()}] ${b.title}: ${b.description}`),
        },
        computedStyles: {},
        userInstructions: `Perbaiki ${bugs.length} bug visual dan masalah layout yang terdeteksi oleh AI Vision pada halaman ini.`,
        userBugNotes: fullMarkdownNotes,
        annotations: bugs.map((b, i) => {
          const bounds = this.resolvedBoundsMap.get(i);
          return {
            type: 'bug' as const,
            x: bounds?.x ?? b.x,
            y: bounds?.y ?? b.y,
            width: bounds?.width ?? b.width ?? 80,
            height: bounds?.height ?? b.height ?? 40,
            color: b.severity === 'critical' ? '#ef4444' : b.severity === 'warning' ? '#f59e0b' : '#38bdf8',
            text: `#${i + 1} ${b.title}`,
          };
        }),
        screenshotDataUrl: screenshotDataUrl,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      },
    });

    this.showToast(`⚡ Synced ${bugs.length} bugs to MCP! Pull them in AI chat via letme_get_active_element.`);
  }

  clearPins() {
    this.activePins.forEach((p) => p.remove());
    this.activePins = [];
    this.resolvedBoundsMap.clear();
    document.getElementById('letme-bug-drawer')?.remove();
    document.getElementById('letme-bug-minimized-pill')?.remove();
    this.hideScanningHUD();
  }

  private showModalAlert(title: string, message: string) {
    const existing = document.getElementById('letme-autobug-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'letme-autobug-alert';
    overlay.className = 'letme-ui-root';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.65)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '2147483647';
    overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const card = document.createElement('div');
    card.style.width = '440px';
    card.style.maxWidth = '92vw';
    card.style.backgroundColor = '#09090b';
    card.style.border = '1px solid #27272a';
    card.style.borderRadius = '12px';
    card.style.padding = '20px';
    card.style.color = '#fafafa';
    card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.8)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '14px';

    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:22px;">⚠️</span>
        <h3 style="margin:0; font-size:15px; font-weight:700; color:#fafafa;">${title}</h3>
      </div>
      <div style="font-size:13px; line-height:1.55; color:#a1a1aa; white-space:pre-wrap;">${message}</div>
      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;">
        <button id="letme-alert-close" style="background:#ffffff; color:#000000; border:none; padding:7px 18px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;">Dismiss</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.querySelector('#letme-alert-close')?.addEventListener('click', () => {
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#09090b';
    toast.style.border = '1px solid #27272a';
    toast.style.color = '#fafafa';
    toast.style.padding = '8px 18px';
    toast.style.borderRadius = '9999px';
    toast.style.fontSize = '12px';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '2147483647';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
}

export const autoBugDetector = new AutoBugDetector();
