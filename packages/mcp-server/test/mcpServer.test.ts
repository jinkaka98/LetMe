import test from 'node:test';
import assert from 'node:assert/strict';
import { StateStore, globalStore } from '../dist/stateStore.js';
import { handleGetActiveElement } from '../dist/tools/getActiveElement.js';
import { handleListInspections } from '../dist/tools/listInspections.js';
import { handleClearPreview } from '../dist/tools/clearPreview.js';
import { handleGetConsoleLogs } from '../dist/tools/getConsoleLogs.js';
import { handleResolveInspection } from '../dist/tools/resolveInspection.js';
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

test('handleGetActiveElement renders multi-layer breakdown and globalInstructions', () => {
  const baseBox = {
    width: 120,
    height: 40,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    content: { width: 96, height: 24 },
    boundingBox: { x: 0, y: 0, top: 0, right: 120, bottom: 40, left: 0, width: 120, height: 40 },
  };
  const baseCtx = { parentTagName: 'div', parentSelector: '.wrap', display: 'flex', position: 'relative', isFlexChild: true, isGridChild: false };
  const baseBugs = { hasHorizontalScrollLeak: false, isClippedByAncestor: false, hasZIndexConflict: false, zIndex: 'auto', warnings: [] };

  const multiSnap: ElementSnapshot = {
    id: 'snap_multi_1',
    timestamp: Date.now(),
    url: 'https://example.com',
    pageTitle: 'Multi',
    selector: '#btn-1',
    tagName: 'button',
    classNames: ['cta'],
    outerHtmlSnippet: '<button id="btn-1">Save</button>',
    boxModel: baseBox,
    layoutContext: baseCtx,
    layoutBugs: baseBugs,
    computedStyles: { color: '#ffffff' },
    annotations: [{ id: 'a1', type: 'text', text: 'Fix spacing', color: '#ef4444', strokeWidth: 2 }],
    globalInstructions: 'Keep dark monochrome theme consistent.',
    layers: [
      {
        index: 1,
        tag: 'design',
        selector: '#btn-1',
        tagName: 'button',
        note: 'Increase padding',
        outerHtmlSnippet: '<button id="btn-1">Save</button>',
        boxModel: baseBox,
        layoutContext: baseCtx,
        layoutBugs: baseBugs,
        computedStyles: { padding: '8px 12px' },
        annotations: [{ id: 'a1', type: 'text', text: 'Fix spacing', color: '#ef4444', strokeWidth: 2 }],
      },
      {
        index: 2,
        tag: 'bug',
        selector: '.card-title',
        tagName: 'h2',
        note: 'Text overflows on mobile',
        outerHtmlSnippet: '<h2 class="card-title">Title</h2>',
        boxModel: baseBox,
        layoutContext: baseCtx,
        layoutBugs: baseBugs,
        computedStyles: { 'font-size': '18px' },
        annotations: [],
      },
    ],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
  };

  globalStore.setActiveElement(multiSnap);
  const res = handleGetActiveElement('snap_multi_1');
  const txt = res.content[0].type === 'text' ? res.content[0].text : '';
  assert.match(txt, /All Picked Layers \(2 Layers\)/);
  assert.match(txt, /Layer #1 \[DESIGN\]/);
  assert.match(txt, /Layer #2 \[BUG\]/);
  assert.match(txt, /Additional Final Instructions/);
  assert.match(txt, /Keep dark monochrome theme consistent/);
});

test('handleGetActiveElement renders sourceContext/semanticAnchors and handleResolveInspection marks resolved', () => {
  const baseBox = {
    width: 140,
    height: 44,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    border: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    content: { width: 108, height: 24 },
    boundingBox: { x: 0, y: 0, top: 0, right: 140, bottom: 44, left: 0, width: 140, height: 44 },
  };
  const snap: ElementSnapshot = {
    id: 'snap_src_1',
    timestamp: Date.now(),
    url: 'http://localhost:3000/pricing',
    pageTitle: 'Pricing',
    selector: '.pricing-cta',
    tagName: 'button',
    classNames: ['pricing-cta'],
    outerHtmlSnippet: '<button class="pricing-cta">Upgrade</button>',
    boxModel: baseBox,
    layoutContext: { parentTagName: 'div', parentSelector: '.card', display: 'flex', position: 'relative', isFlexChild: true, isGridChild: false },
    layoutBugs: { hasHorizontalScrollLeak: false, isClippedByAncestor: false, hasZIndexConflict: false, zIndex: 'auto', warnings: [] },
    computedStyles: { color: '#ffffff' },
    sourceContext: {
      framework: 'react',
      componentName: 'PricingCard',
      ownerChain: ['App', 'PricingSection', 'PricingCard'],
      filePath: 'src/components/PricingCard.tsx',
      lineRange: '42-52',
    },
    semanticAnchors: {
      nearestHeading: 'Pro Plan',
      ariaLabel: 'Upgrade to Pro',
      dataTestId: 'upgrade-pro-btn',
    },
    status: 'pending',
    annotations: [{ id: 'sn1', type: 'sticky', stickyTheme: 'rose', text: 'Check mobile alignment' }],
    viewport: { width: 1280, height: 720, devicePixelRatio: 1 },
  };

  globalStore.setActiveElement(snap);
  const activeRes = handleGetActiveElement('snap_src_1');
  const activeTxt = activeRes.content[0].type === 'text' ? activeRes.content[0].text : '';
  assert.match(activeTxt, /Component & Source Mapping/);
  assert.match(activeTxt, /PricingCard/);
  assert.match(activeTxt, /src\/components\/PricingCard\.tsx:42-52/);
  assert.match(activeTxt, /Semantic Anchors/);
  assert.match(activeTxt, /Pro Plan/);
  assert.match(activeTxt, /upgrade-pro-btn/);
  assert.match(activeTxt, /Sticky Note \[rose\]: "Check mobile alignment"/);

  const resolveRes = handleResolveInspection({ id: 'snap_src_1', resolutionNote: 'Updated PricingCard.tsx padding' });
  const resolveTxt = resolveRes.content[0].type === 'text' ? resolveRes.content[0].text : '';
  assert.match(resolveTxt, /\*\*resolved\*\*/);
  assert.match(resolveTxt, /Updated PricingCard\.tsx padding/);

  const afterRes = handleGetActiveElement('snap_src_1');
  const afterTxt = afterRes.content[0].type === 'text' ? afterRes.content[0].text : '';
  assert.match(afterTxt, /\*\*Status\*\*: `resolved`/);
});
