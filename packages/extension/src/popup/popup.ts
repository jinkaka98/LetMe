const PROVIDER_PRESETS: Record<string, { baseUrl: string; defaultModel: string; hint: string }> = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    hint: 'Enter OpenRouter API Key (sk-or-...)',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    hint: 'Enter Google Gemini API Key (AIzaSy...)',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    hint: 'Enter OpenAI API Key (sk-...)',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.2-11b-vision-preview',
    hint: 'Enter Groq API Key (gsk_...)',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llava',
    hint: 'Localhost Ollama (Key usually optional)',
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
    hint: 'Enter custom Base URL and API Key',
  },
};

function init() {
  const statusBadge = document.getElementById('mcp-status');
  const statusText = document.getElementById('mcp-status-text');

  // Views & Navigation
  const viewActions = document.getElementById('view-actions');
  const viewSettings = document.getElementById('view-settings');
  const btnTabSettings = document.getElementById('btn-tab-settings');
  const btnBackActions = document.getElementById('btn-back-actions');

  // Action Buttons
  const btnStartInspect = document.getElementById('btn-start-inspect');
  const btnShotArea = document.getElementById('btn-shot-area');
  const btnShotFull = document.getElementById('btn-shot-full');
  const btnMultiPick = document.getElementById('btn-multi-pick');
  const btnAutoBug = document.getElementById('btn-auto-bug');
  const badgeAiProvider = document.getElementById('badge-ai-provider');
  const aiProviderInfo = document.getElementById('ai-provider-info');

  // Settings form elements
  const formSettings = document.getElementById('form-settings') as HTMLFormElement;
  const selectProvider = document.getElementById('select-provider') as HTMLSelectElement;
  const fieldCustomUrl = document.getElementById('field-custom-url') as HTMLDivElement;
  const inputBaseUrl = document.getElementById('input-base-url') as HTMLInputElement;
  const inputApiKey = document.getElementById('input-api-key') as HTMLInputElement;
  const apiKeyHint = document.getElementById('api-key-hint');
  const inputModel = document.getElementById('input-model') as HTMLInputElement;
  const selectModel = document.getElementById('select-model') as HTMLSelectElement;
  const btnFetchModels = document.getElementById('btn-fetch-models') as HTMLButtonElement;
  const modelFetchStatus = document.getElementById('model-fetch-status');
  const settingsStatus = document.getElementById('settings-status');

  // Clear legacy inspectMode flag if stored
  chrome.storage.local.remove('inspectMode');

  // 1. Check MCP Status (Initial + Broadcasts + Polling)
  chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => {
    updateMcpStatus(res?.connected ?? false);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'MCP_STATUS_CHANGED') {
      updateMcpStatus(msg.connected ?? false);
    }
  });

  const statusPollInterval = setInterval(() => {
    chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => {
      updateMcpStatus(res?.connected ?? false);
    });
  }, 1500);

  window.addEventListener('unload', () => {
    clearInterval(statusPollInterval);
  });

  statusBadge?.addEventListener('click', () => {
    if (statusText) statusText.innerText = 'Connecting...';
    chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => {
      updateMcpStatus(res?.connected ?? false);
    });
  });

  function updateMcpStatus(connected: boolean) {
    if (!statusBadge || !statusText) return;
    if (connected) {
      statusBadge.className = 'status-badge connected';
      statusText.innerText = 'Connected';
    } else {
      statusBadge.className = 'status-badge disconnected';
      statusText.innerText = 'Offline';
    }
  }

  // 2. Navigation
  btnTabSettings?.addEventListener('click', () => {
    viewActions?.classList.remove('active');
    viewSettings?.classList.add('active');
    loadSettings();
  });

  btnBackActions?.addEventListener('click', () => {
    viewSettings?.classList.remove('active');
    viewActions?.classList.add('active');
    updateProviderBadge();
  });

  // 3. Provider Preset Switcher
  selectProvider?.addEventListener('change', () => {
    const p = selectProvider.value;
    const preset = PROVIDER_PRESETS[p];
    if (!preset) return;

    if (p === 'custom') {
      fieldCustomUrl.style.display = 'flex';
      if (apiKeyHint) apiKeyHint.innerText = preset.hint;
    } else {
      fieldCustomUrl.style.display = 'none';
      inputBaseUrl.value = preset.baseUrl;
      if (apiKeyHint) apiKeyHint.innerText = preset.hint;
      if (!inputModel.value || Object.values(PROVIDER_PRESETS).some((x) => x.defaultModel === inputModel.value)) {
        inputModel.value = preset.defaultModel;
      }
    }
  });

  // 4. Fetch Models
  btnFetchModels?.addEventListener('click', async () => {
    let rawBase = selectProvider.value === 'custom' ? inputBaseUrl.value.trim() : PROVIDER_PRESETS[selectProvider.value]?.baseUrl;
    const key = inputApiKey.value.trim();

    if (!rawBase) {
      alert('Please specify a Base URL first.');
      return;
    }

    if (!/^https?:\/\//i.test(rawBase)) {
      rawBase = (rawBase.startsWith('localhost') || rawBase.startsWith('127.0.0.1')) ? `http://${rawBase}` : `https://${rawBase}`;
    }

    const cleanBase = rawBase.replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    const modelsUrl = `${cleanBase}/models`;

    if (modelFetchStatus) modelFetchStatus.innerText = 'Fetching models...';
    btnFetchModels.disabled = true;

    try {
      const headers: Record<string, string> = {};
      if (key) {
        headers['Authorization'] = `Bearer ${key}`;
      }

      const proxyRes: { ok: boolean; status: number; text?: string; error?: string } = await chrome.runtime.sendMessage({
        type: 'PROXY_HTTP_GET',
        payload: { url: modelsUrl, headers },
      });

      if (!proxyRes) {
        throw new Error('Background proxy service is unavailable.');
      }

      if (!proxyRes.ok) {
        throw new Error(proxyRes.error || `HTTP ${proxyRes.status}: ${proxyRes.text}`);
      }

      const rawTxt = proxyRes.text || '';
      if (rawTxt.trim().startsWith('<')) {
        throw new Error('Endpoint returned HTML page instead of JSON. Ensure Base URL is correct and starts with https://');
      }

      const json = JSON.parse(rawTxt);
      const rawList: any[] = json.data || json.models || (Array.isArray(json) ? json : []);

      if (rawList.length === 0) {
        throw new Error('No models found in response.');
      }

      const modelIds: string[] = rawList.map((m) => (typeof m === 'string' ? m : m.id || m.name)).filter(Boolean);

      // Populate select dropdown
      selectModel.innerHTML = '<option value="">-- Choose Loaded Model --</option>';
      modelIds.forEach((id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = id;
        selectModel.appendChild(opt);
      });

      selectModel.style.display = 'block';
      if (inputModel.value && modelIds.includes(inputModel.value)) {
        selectModel.value = inputModel.value;
      }

      selectModel.onchange = () => {
        if (selectModel.value) {
          inputModel.value = selectModel.value;
        }
      };

      if (modelFetchStatus) {
        modelFetchStatus.innerText = `Loaded ${modelIds.length} models!`;
      }
    } catch (err: any) {
      console.warn('[LetMe] Failed to fetch models:', err);
      if (modelFetchStatus) {
        modelFetchStatus.innerText = `Fetch failed: ${err.message}. You can still type manually.`;
      }
    } finally {
      btnFetchModels.disabled = false;
    }
  });

  // 5. Load & Save Settings
  function loadSettings() {
    chrome.storage.local.get(['aiProvider', 'aiBaseUrl', 'aiApiKey', 'aiModel']).then((data) => {
      let p = data.aiProvider || 'openrouter';
      let baseUrl = data.aiBaseUrl || '';

      // Auto-fix protocol if missing
      if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
        baseUrl = (baseUrl.startsWith('localhost') || baseUrl.startsWith('127.0.0.1')) ? `http://${baseUrl}` : `https://${baseUrl}`;
        chrome.storage.local.set({ aiBaseUrl: baseUrl });
      }

      // If user accidentally entered their web app port 28120 without /v1, clean it up
      if (baseUrl.includes(':28120') && !baseUrl.includes('/v1')) {
        baseUrl = PROVIDER_PRESETS[p]?.baseUrl || 'https://openrouter.ai/api/v1';
        chrome.storage.local.set({ aiBaseUrl: baseUrl });
      }

      if (selectProvider) selectProvider.value = p;

      if (p === 'custom') {
        fieldCustomUrl.style.display = 'flex';
        if (inputBaseUrl) inputBaseUrl.value = baseUrl;
      } else {
        fieldCustomUrl.style.display = 'none';
        if (inputBaseUrl) inputBaseUrl.value = baseUrl || PROVIDER_PRESETS[p]?.baseUrl || '';
      }

      if (inputApiKey) inputApiKey.value = data.aiApiKey || '';
      if (inputModel) inputModel.value = data.aiModel || PROVIDER_PRESETS[p]?.defaultModel || '';
      if (apiKeyHint && PROVIDER_PRESETS[p]) apiKeyHint.innerText = PROVIDER_PRESETS[p].hint;
    });
  }

  function updateProviderBadge() {
    chrome.storage.local.get(['aiProvider', 'aiApiKey', 'aiModel', 'aiBaseUrl']).then((data) => {
      const p = data.aiProvider || 'openrouter';
      const key = data.aiApiKey;
      const model = data.aiModel || PROVIDER_PRESETS[p]?.defaultModel || 'default';
      const baseUrl = data.aiBaseUrl || '';

      if (baseUrl.includes(':28120')) {
        if (badgeAiProvider) badgeAiProvider.innerText = 'Config Warning';
        if (aiProviderInfo) aiProviderInfo.innerText = 'Base URL points to web app (28120). Open Settings.';
        return;
      }

      if (!key && p !== 'ollama') {
        if (badgeAiProvider) badgeAiProvider.innerText = 'Not Set';
        if (aiProviderInfo) aiProviderInfo.innerText = 'Open Settings tab to enter API Key';
        return;
      }

      const providerLabel = p.charAt(0).toUpperCase() + p.slice(1);
      if (badgeAiProvider) badgeAiProvider.innerText = providerLabel;
      if (aiProviderInfo) aiProviderInfo.innerText = `${providerLabel}: ${model}`;
    });
  }

  formSettings?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = selectProvider.value;
    let finalBaseUrl = p === 'custom' ? inputBaseUrl.value.trim() : (PROVIDER_PRESETS[p]?.baseUrl || inputBaseUrl.value.trim());

    if (finalBaseUrl && !/^https?:\/\//i.test(finalBaseUrl)) {
      finalBaseUrl = (finalBaseUrl.startsWith('localhost') || finalBaseUrl.startsWith('127.0.0.1')) ? `http://${finalBaseUrl}` : `https://${finalBaseUrl}`;
    }

    if (finalBaseUrl.includes(':28120') && !finalBaseUrl.includes('/v1')) {
      alert('Cannot save localhost:28120 without /v1 as AI Base URL.\n\nPort 28120 is your Alpakyros web app. The OpenAI-compatible API path is http://localhost:28120/v1');
      return;
    }

    await chrome.storage.local.set({
      aiProvider: p,
      aiBaseUrl: finalBaseUrl || 'https://openrouter.ai/api/v1',
      aiApiKey: inputApiKey.value.trim(),
      aiModel: inputModel.value.trim() || 'google/gemini-2.0-flash-001',
    });

    if (settingsStatus) {
      settingsStatus.innerText = 'Settings saved successfully!';
      setTimeout(() => {
        if (settingsStatus) settingsStatus.innerText = '';
      }, 2000);
    }
    updateProviderBadge();
  });

  updateProviderBadge();

  // 6. Active Tab Actions
  chrome.tabs.query({ active: true, currentWindow: true }).then(([activeTab]) => {
    if (!activeTab || !activeTab.id) return;

    const url = activeTab.url || '';
    const isRestrictedUrl =
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:');

    if (isRestrictedUrl) {
      [btnStartInspect, btnShotArea, btnShotFull, btnMultiPick, btnAutoBug].forEach((btn) => {
        if (btn) {
          (btn as HTMLButtonElement).disabled = true;
          btn.style.opacity = '0.4';
          btn.style.cursor = 'not-allowed';
        }
      });
      return;
    }

    async function sendTabMessageWithInjection(type: string) {
      chrome.tabs.sendMessage(activeTab!.id!, { type }, async () => {
        if (chrome.runtime.lastError) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: activeTab!.id! },
              files: ['contentScript.js'],
            });
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab!.id!, { type });
              window.close();
            }, 100);
          } catch {
            alert('Please refresh this webpage once to enable LetMe Inspector.');
          }
          return;
        }
        window.close();
      });
    }

    // Manual Inspector (Always Manual!)
    btnStartInspect?.addEventListener('click', () => {
      sendTabMessageWithInjection('START_INSPECT');
    });

    // Multi-Element Stager
    btnMultiPick?.addEventListener('click', () => {
      sendTabMessageWithInjection('START_MULTI_PICK');
    });

    // Screenshots
    btnShotArea?.addEventListener('click', () => {
      sendTabMessageWithInjection('START_SCREENSHOT_AREA');
    });

    btnShotFull?.addEventListener('click', () => {
      sendTabMessageWithInjection('START_SCREENSHOT_FULL');
    });

    // AI Vision Bug Detection (Explicit, with pre-check)
    btnAutoBug?.addEventListener('click', async () => {
      const data = await chrome.storage.local.get(['aiProvider', 'aiApiKey', 'aiBaseUrl']);
      const p = data.aiProvider || 'openrouter';
      const key = data.aiApiKey;
      const baseUrl = data.aiBaseUrl || '';

      if (baseUrl.includes(':28120')) {
        alert(
          'Invalid AI Vision Base URL:\n\n' +
          'Your AI Base URL is set to "http://localhost:28120", which is your local web app (Alpakyros), NOT an AI Vision LLM endpoint.\n\n' +
          'Switching to Settings tab now so you can select a real provider (e.g. Gemini, OpenRouter, or OpenAI).'
        );
        viewActions?.classList.remove('active');
        viewSettings?.classList.add('active');
        loadSettings();
        return;
      }

      if (!key && p !== 'ollama') {
        alert(
          'API Key Required:\n\n' +
          'AI Vision Auto Bug Detection requires an API Key.\n\n' +
          'Switching to Settings tab now so you can enter your API Key.'
        );
        viewActions?.classList.remove('active');
        viewSettings?.classList.add('active');
        loadSettings();
        return;
      }

      sendTabMessageWithInjection('START_AUTO_BUG_DETECT');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
