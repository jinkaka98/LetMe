import { elementInspector } from './inspector.js';
import { livePreviewManager } from './livePreview.js';
import { screenshotTool } from './screenshotTool.js';
import { multiPicker } from './multiPicker.js';
import { autoBugDetector } from './autoBugDetector.js';
import {
  ConsoleLogEntry,
  CustomShortcutsConfig,
  DEFAULT_CUSTOM_SHORTCUTS,
} from '@letme/shared';
import {
  formatChordFromSet,
  mergeShortcutsConfig,
  normalizeKeyToken,
  SHORTCUTS_STORAGE_KEY,
} from '../shortcuts.js';

console.log('[LetMe v2] Content script initialized on:', window.location.href);

let activeShortcuts: CustomShortcutsConfig = { ...DEFAULT_CUSTOM_SHORTCUTS };

chrome.storage.local.get(SHORTCUTS_STORAGE_KEY).then((data) => {
  activeShortcuts = mergeShortcutsConfig(data[SHORTCUTS_STORAGE_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[SHORTCUTS_STORAGE_KEY]) {
    activeShortcuts = mergeShortcutsConfig(changes[SHORTCUTS_STORAGE_KEY].newValue);
  }
});

const pressedKeys = new Set<string>();
let lastTriggeredChord = '';

window.addEventListener('blur', () => {
  pressedKeys.clear();
  lastTriggeredChord = '';
});

window.addEventListener(
  'keyup',
  (e: KeyboardEvent) => {
    const token = normalizeKeyToken(e);
    if (token) {
      pressedKeys.delete(token);
    }
    if (pressedKeys.size === 0) {
      lastTriggeredChord = '';
    }
  },
  true
);

window.addEventListener(
  'keydown',
  (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const isEditable =
      !!target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    if (isEditable && !e.altKey && !e.ctrlKey && !e.metaKey) {
      return;
    }

    if (e.repeat) return;

    // Sync modifier state to prevent stuck modifiers after focus/alt-tab
    if (!e.ctrlKey) pressedKeys.delete('Ctrl');
    if (!e.altKey) pressedKeys.delete('Alt');
    if (!e.shiftKey) pressedKeys.delete('Shift');
    if (!e.metaKey) pressedKeys.delete('Meta');

    const token = normalizeKeyToken(e);
    if (!token) return;
    pressedKeys.add(token);

    const combo = formatChordFromSet(pressedKeys);
    if (!combo || combo === lastTriggeredChord) return;

    if (combo === activeShortcuts.inspect) {
      lastTriggeredChord = combo;
      e.preventDefault();
      e.stopPropagation();
      multiPicker.stop();
      elementInspector.toggle();
    } else if (combo === activeShortcuts.pickAudit) {
      lastTriggeredChord = combo;
      e.preventDefault();
      e.stopPropagation();
      elementInspector.stop();
      multiPicker.toggle();
    } else if (combo === activeShortcuts.pickAi) {
      lastTriggeredChord = combo;
      e.preventDefault();
      e.stopPropagation();
      multiPicker.stop();
      elementInspector.stop();
      autoBugDetector.runDetection();
    } else if (combo === activeShortcuts.screenshot) {
      lastTriggeredChord = combo;
      e.preventDefault();
      e.stopPropagation();
      elementInspector.stop();
      multiPicker.stop();
      if (activeShortcuts.screenshotMode === 'full') {
        screenshotTool.captureFullPage();
      } else {
        screenshotTool.startAreaCapture();
      }
    }
  },
  true
);

// Listen for messages from background service worker or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_INSPECTOR':
    case 'START_INSPECT': {
      multiPicker.stop();
      elementInspector.toggle();
      sendResponse({ active: elementInspector.isInspecting() });
      return false;
    }

    case 'START_AUTO_BUG_DETECT': {
      multiPicker.stop();
      elementInspector.stop();
      autoBugDetector.runDetection();
      sendResponse({ success: true });
      return false;
    }

    case 'START_SCREENSHOT_AREA': {
      elementInspector.stop();
      multiPicker.stop();
      screenshotTool.startAreaCapture();
      sendResponse({ success: true });
      return false;
    }

    case 'START_SCREENSHOT_FULL': {
      elementInspector.stop();
      multiPicker.stop();
      screenshotTool.captureFullPage();
      sendResponse({ success: true });
      return false;
    }

    case 'START_MULTI_PICK': {
      elementInspector.stop();
      multiPicker.toggle();
      sendResponse({ success: true });
      return false;
    }

    case 'GET_STATUS': {
      chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => {
        sendResponse({
          inspecting: elementInspector.isInspecting(),
          mcpConnected: res?.connected ?? false,
        });
      });
      return true; // async response
    }

    case 'APPLY_CSS_PREVIEW': {
      const { selector, cssRules } = message.payload;
      const res = livePreviewManager.applyPreview(selector, cssRules);
      sendResponse(res);
      return false;
    }

    case 'CLEAR_CSS_PREVIEW': {
      livePreviewManager.clearPreview(message.payload?.selector);
      sendResponse({ success: true });
      return false;
    }

    case 'HIGHLIGHT_ELEMENT': {
      livePreviewManager.highlightElement(message.payload.selector, message.payload.durationMs);
      sendResponse({ success: true });
      return false;
    }
  }

  return false;
});

// Capture console warnings and errors for AI context
const capturedLogs: ConsoleLogEntry[] = [];
export function getRecentConsoleLogs(): ConsoleLogEntry[] {
  return [...capturedLogs];
}
const originalError = console.error;
const originalWarn = console.warn;

console.error = function (...args: any[]) {
  try {
    const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const entry: ConsoleLogEntry = {
      type: 'error',
      message,
      timestamp: Date.now(),
      stack: new Error().stack,
    };
    capturedLogs.push(entry);
    if (capturedLogs.length > 20) capturedLogs.shift();

    chrome.runtime.sendMessage({
      type: 'CONSOLE_LOGS',
      payload: {
        url: window.location.href,
        logs: [entry],
      },
    });
  } catch {}
  originalError.apply(console, args);
};

console.warn = function (...args: any[]) {
  try {
    const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const entry: ConsoleLogEntry = {
      type: 'warn',
      message,
      timestamp: Date.now(),
    };
    capturedLogs.push(entry);
    if (capturedLogs.length > 20) capturedLogs.shift();
  } catch {}
  originalWarn.apply(console, args);
};
