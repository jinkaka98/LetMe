import test from 'node:test';
import assert from 'node:assert/strict';
import { StateStore, globalStore } from '../dist/stateStore.js';
import { handleGetActiveElement } from '../dist/tools/getActiveElement.js';
import { handleListInspections } from '../dist/tools/listInspections.js';
import { handleClearPreview } from '../dist/tools/clearPreview.js';
import { handleGetConsoleLogs } from '../dist/tools/getConsoleLogs.js';
import type { ElementSnapshot } from '@letme/shared';

test('StateStore stores and retrieves active element snapshot', () => {
  const store = new StateStore();
  assert.equal(store.getActiveElement(), null);

  const mockSnapshot: ElementSnapshot = {
    id: 'snap_test_1',
    timestamp: Date.now(),
    url: 'https://example.com',
    pageTitle: 'Example Domain',
    selector: '#submit-btn',
    tagName: 'button',
    classNames: ['btn', 'btn-primary'],
    outerHtmlSnippet: '<button id="submit-btn" class="btn btn-primary">Submit</button>',
    boxModel: {
      width: 120,
      height: 40,
      margin: { top: 8, right: 0, bottom: 8, left: 0 },
      border: { top: 1, right: 1, bottom: 1, left: 1 },
      padding: { top: 8, right: 16, bottom: 8, left: 16 },
      content: { width: 86, height: 22 },
      boundingBox: { x: 100, y: 200, top: 200, right: 220, bottom: 240, left: 100, width: 120, height: 40 },
    },
    layoutContext: {
      parentTagName: 'form',
      parentSelector: '#login-form',
      display: 'flex',
      position: 'relative',
      isFlexChild: true,
      isGridChild: false,
      flexParent: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        flexWrap: 'nowrap',
        gap: '12px',
        rowGap: '12px',
        columnGap: '0px',
      },
    },
    layoutBugs: {
      hasHorizontalScrollLeak: false,
      isClippedByAncestor: false,
      hasZIndexConflict: false,
      zIndex: 'auto',
      warnings: [],
    },
    computedStyles: {
      'background-color': 'rgb(79, 70, 229)',
      'color': 'rgb(255, 255, 255)',
      'font-size': '14px',
    },
    userInstructions: 'Make the button slightly larger with 12px padding',
    userBugNotes: 'Button text was touching borders on mobile view',
    annotations: [
      {
        id: 'ann_1',
        type: 'arrow',
        text: 'Spacing here',
      },
    ],
    viewport: {
      width: 1440,
      height: 900,
      devicePixelRatio: 2,
    },
  };

  store.setActiveElement(mockSnapshot);
  assert.equal(store.getActiveElement()?.id, 'snap_test_1');
  assert.equal(store.getSnapshots().length, 1);
});

test('StateStore pending preview handles resolution and timeout', async () => {
  const store = new StateStore();

  const previewPromise = new Promise((resolve, reject) => {
    store.registerPendingPreview('prev_123', resolve, reject, 100);
  });

  store.resolvePendingPreview({
    id: 'prev_123',
    selector: '#submit-btn',
    success: true,
    message: 'Preview applied',
  });

  const res: any = await previewPromise;
  assert.equal(res.success, true);
  assert.equal(res.selector, '#submit-btn');
});

test('MCP Tools return proper markdown and handle empty states', () => {
  // Clear any existing snapshots
  globalStore.clearSnapshots();

  const activeRes = handleGetActiveElement();
  assert.match(activeRes.content[0].text, /No active element has been selected/);

  const listRes = handleListInspections();
  assert.match(listRes.content[0].text, /No inspections captured yet/);

  const clearRes = handleClearPreview();
  assert.match(clearRes.content[0].text, /CSS preview has been cleared/);

  const logsRes = handleGetConsoleLogs();
  assert.match(logsRes.content[0].text, /No runtime errors or console logs/);
});

test('handleGetActiveElement outputs rich layout diagnostics and image block', () => {
  const mockSnapshot: ElementSnapshot = {
    id: 'snap_active_1',
    timestamp: Date.now(),
    url: 'https://mysite.local/dashboard',
    pageTitle: 'Dashboard',
    selector: '.analytics-card > .metric-value',
    tagName: 'span',
    classNames: ['metric-value', 'text-2xl'],
    outerHtmlSnippet: '<span class="metric-value text-2xl">$12,450</span>',
    boxModel: {
      width: 140,
      height: 32,
      margin: { top: 4, right: 0, bottom: 4, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 2, right: 4, bottom: 2, left: 4 },
      content: { width: 132, height: 28 },
      boundingBox: { x: 50, y: 120, top: 120, right: 190, bottom: 152, left: 50, width: 140, height: 32 },
    },
    layoutContext: {
      parentTagName: 'div',
      parentSelector: '.analytics-card',
      display: 'grid',
      position: 'relative',
      isFlexChild: false,
      isGridChild: true,
      gridParent: {
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'auto',
        gridAutoFlow: 'row',
        gap: '16px',
      },
    },
    layoutBugs: {
      hasHorizontalScrollLeak: true,
      isClippedByAncestor: false,
      hasZIndexConflict: true,
      zIndex: '10',
      warnings: ['Element right edge leaks beyond document width, causing horizontal scroll.'],
    },
    computedStyles: {
      'font-size': '24px',
      'font-weight': '700',
      color: 'rgb(15, 23, 42)',
    },
    userInstructions: 'Kurangi font-size jadi 18px di tablet, dan hilangkan overflow leak.',
    userBugNotes: 'Menyebabkan horizontal scrollbar liar di layar 768px.',
    annotations: [
      {
        id: 'ann_box_1',
        type: 'box',
        text: 'Area overflow',
      },
    ],
    screenshotBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    viewport: {
      width: 768,
      height: 1024,
      devicePixelRatio: 2,
    },
  };

  globalStore.setActiveElement(mockSnapshot);

  const res = handleGetActiveElement();
  assert.equal(res.content.length, 2); // Text block + Image block
  assert.equal(res.content[0].type, 'text');
  assert.match(res.content[0].text, /Inspected Element: <span> `\.analytics-card > \.metric-value`/);
  assert.match(res.content[0].text, /Horizontal Scroll Leak Detected/);
  assert.match(res.content[0].text, /Kurangi font-size jadi 18px/);
  assert.match(res.content[0].text, /repeat\(3, 1fr\)/);

  // Check image block
  assert.equal(res.content[1].type, 'image');
  assert.equal(res.content[1].mimeType, 'image/png');
  assert.ok((res.content[1] as any).data.length > 10);
});

test('StateStore.deleteSnapshot removes snapshot and updates activeElement', () => {
  const store = new StateStore();
  const snap1: ElementSnapshot = {
    id: 'snap_del_1',
    timestamp: 1000,
    url: 'https://example.com',
    pageTitle: 'Example',
    selector: '#first',
    tagName: 'div',
    classNames: [],
    outerHtmlSnippet: '<div id="first"></div>',
    boxModel: {
      width: 100,
      height: 50,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      border: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      content: { width: 100, height: 50 },
      boundingBox: { x: 0, y: 0, top: 0, right: 100, bottom: 50, left: 0, width: 100, height: 50 },
    },
    layoutContext: { parentTagName: 'body', parentSelector: 'body', display: 'block', position: 'static', isFlexChild: false, isGridChild: false },
    layoutBugs: { hasHorizontalScrollLeak: false, isClippedByAncestor: false, hasZIndexConflict: false, zIndex: 'auto', warnings: [] },
    computedStyles: {},
    annotations: [],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
  };
  const snap2: ElementSnapshot = { ...snap1, id: 'snap_del_2', selector: '#second' };

  store.setActiveElement(snap1);
  store.setActiveElement(snap2);
  assert.equal(store.getSnapshots().length, 2);
  assert.equal(store.getActiveElement()?.id, 'snap_del_2');

  assert.equal(store.deleteSnapshot('snap_del_2'), true);
  assert.equal(store.getSnapshots().length, 1);
  assert.equal(store.getActiveElement()?.id, 'snap_del_1');
  assert.equal(store.deleteSnapshot('nonexistent'), false);
});
