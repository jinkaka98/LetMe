import { globalStore } from '../stateStore.js';
import { ElementSnapshot } from '@letme/shared';

export function handleGetActiveElement(id?: string) {
  let element = globalStore.getActiveElement();

  if (id) {
    const found = globalStore
      .getSnapshots()
      .find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase());
    if (found) {
      element = found;
    }
  }

  if (!element) {
    return {
      content: [
        {
          type: 'text' as const,
          text: id
            ? `Report or snapshot with ID "${id}" was not found in LetMe MCP Server.\n\nPlease check active inspections with letme_list_inspections or capture a new inspection in the browser.`
            : `No active element has been selected in the browser yet.\n\nPlease open your browser with the LetMe Chrome extension, click "Start Inspect", select an element, add any visual markup notes, and click "Send to AI".`,
        },
      ],
    };
  }

  // Build structured Markdown presentation for the AI
  const lines: string[] = [];
  lines.push(`# Inspected Element: <${element.tagName.toLowerCase()}> \`${element.selector}\``);
  lines.push(`- **Session / Report ID**: \`${element.id}\``);
  lines.push(`- **Page Title**: ${element.pageTitle}`);
  lines.push(`- **URL**: ${element.url}`);
  lines.push(`- **Timestamp**: ${new Date(element.timestamp).toISOString()}`);
  lines.push(`- **Classes**: ${element.classNames.length > 0 ? element.classNames.map(c => `.${c}`).join(' ') : 'none'}`);
  lines.push('');

  if (element.userInstructions) {
    lines.push(`## 🎯 User Desired Styling / Instruction:`);
    lines.push(`> ${element.userInstructions}`);
    lines.push('');
  }

  if (element.userBugNotes) {
    lines.push(`## 🐛 Reported Bugs / Visual Issues:`);
    lines.push(`> ${element.userBugNotes}`);
    lines.push('');
  }

  // Layout & Box Model
  const bm = element.boxModel;
  lines.push(`## 📐 Box Model & Dimensions:`);
  lines.push(`- **Rendered Size**: ${bm.width}px × ${bm.height}px`);
  lines.push(`- **Bounding Box**: Top: ${bm.boundingBox.top}px, Left: ${bm.boundingBox.left}px, Bottom: ${bm.boundingBox.bottom}px, Right: ${bm.boundingBox.right}px`);
  lines.push(`- **Margin**: Top: ${bm.margin.top}px, Right: ${bm.margin.right}px, Bottom: ${bm.margin.bottom}px, Left: ${bm.margin.left}px`);
  lines.push(`- **Padding**: Top: ${bm.padding.top}px, Right: ${bm.padding.right}px, Bottom: ${bm.padding.bottom}px, Left: ${bm.padding.left}px`);
  lines.push(`- **Border**: Top: ${bm.border.top}px, Right: ${bm.border.right}px, Bottom: ${bm.border.bottom}px, Left: ${bm.border.left}px`);
  lines.push('');

  // Container Context
  const ctx = element.layoutContext;
  lines.push(`## 📦 Parent Layout Context:`);
  lines.push(`- **Parent**: \`${ctx.parentTagName}\` (\`${ctx.parentSelector}\`)`);
  lines.push(`- **Parent Display**: \`${ctx.display}\``);
  lines.push(`- **Position Mode**: \`${ctx.position}\``);
  if (ctx.isFlexChild && ctx.flexParent) {
    lines.push(`- **Flex Container Context**:`);
    lines.push(`  - Direction: \`${ctx.flexParent.flexDirection}\``);
    lines.push(`  - Justify Content: \`${ctx.flexParent.justifyContent}\``);
    lines.push(`  - Align Items: \`${ctx.flexParent.alignItems}\``);
    lines.push(`  - Wrap: \`${ctx.flexParent.flexWrap}\``);
    lines.push(`  - Gap: \`${ctx.flexParent.gap}\``);
  }
  if (ctx.isGridChild && ctx.gridParent) {
    lines.push(`- **Grid Container Context**:`);
    lines.push(`  - Template Columns: \`${ctx.gridParent.gridTemplateColumns}\``);
    lines.push(`  - Template Rows: \`${ctx.gridParent.gridTemplateRows}\``);
    lines.push(`  - Gap: \`${ctx.gridParent.gap}\``);
  }
  lines.push('');

  // Layout Bugs & Diagnostics
  const bugs = element.layoutBugs;
  lines.push(`## ⚠️ Layout & Wireframe Diagnostics:`);
  if (bugs.hasHorizontalScrollLeak) {
    lines.push(`- 🔴 **Horizontal Scroll Leak Detected**: This element expands wider than the viewport or its container bounds!`);
  }
  if (bugs.isClippedByAncestor) {
    lines.push(`- ⚠️ **Ancestor Clipping**: Content is partially or fully clipped by ancestor: \`${bugs.clippingAncestorSelector || 'unknown'}\``);
  }
  if (bugs.hasZIndexConflict) {
    lines.push(`- ⚠️ **Z-Index Conflict / Stacking**: Current z-index is \`${bugs.zIndex}\`. May be obscured or obscuring adjacent elements.`);
  }
  if (bugs.safeAreaWarning) {
    lines.push(`- 📱 **Safe Area / Edge Warning**: ${bugs.safeAreaWarning}`);
  }
  if (bugs.warnings.length === 0 && !bugs.hasHorizontalScrollLeak && !bugs.isClippedByAncestor) {
    lines.push(`- ✅ No critical layout leaks or clipping bugs detected.`);
  }
  lines.push('');

  // Markup Annotations
  if (element.annotations && element.annotations.length > 0) {
    lines.push(`## ✏️ Visual Annotations on Screenshot:`);
    element.annotations.forEach((ann, i) => {
      lines.push(`${i + 1}. **${ann.type.toUpperCase()}**: ${ann.text || (ann.type === 'box' ? 'Bug bounding box' : 'Arrow marker')}`);
    });
    lines.push('');
  }

  // Clean HTML Snippet
  lines.push(`## 📄 HTML Snippet:`);
  lines.push('```html');
  lines.push(element.outerHtmlSnippet);
  lines.push('```');
  lines.push('');

  // Key Computed Styles
  lines.push(`## 🎨 Key Computed CSS Styles:`);
  lines.push('```css');
  for (const [prop, val] of Object.entries(element.computedStyles)) {
    lines.push(`${prop}: ${val};`);
  }
  lines.push('```');

  const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
    {
      type: 'text',
      text: lines.join('\n'),
    },
  ];

  // If screenshot is present, provide it as an MCP image block
  if (element.screenshotBase64) {
    // Strip "data:image/png;base64," prefix if included
    const base64Data = element.screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    content.push({
      type: 'image',
      data: base64Data,
      mimeType: 'image/png',
    });
  }

  return { content };
}
