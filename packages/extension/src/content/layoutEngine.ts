import {
  BoxModelMetrics,
  ContainerLayoutContext,
  LayoutBugReport,
} from 'letme-shared';

export function getBoxModel(el: HTMLElement): BoxModelMetrics {
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);

  const parseFloatOrZero = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const margin = {
    top: parseFloatOrZero(cs.marginTop),
    right: parseFloatOrZero(cs.marginRight),
    bottom: parseFloatOrZero(cs.marginBottom),
    left: parseFloatOrZero(cs.marginLeft),
  };

  const border = {
    top: parseFloatOrZero(cs.borderTopWidth),
    right: parseFloatOrZero(cs.borderRightWidth),
    bottom: parseFloatOrZero(cs.borderBottomWidth),
    left: parseFloatOrZero(cs.borderLeftWidth),
  };

  const padding = {
    top: parseFloatOrZero(cs.paddingTop),
    right: parseFloatOrZero(cs.paddingRight),
    bottom: parseFloatOrZero(cs.paddingBottom),
    left: parseFloatOrZero(cs.paddingLeft),
  };

  const content = {
    width: Math.max(0, rect.width - border.left - border.right - padding.left - padding.right),
    height: Math.max(0, rect.height - border.top - border.bottom - padding.top - padding.bottom),
  };

  return {
    width: Math.round(rect.width * 100) / 100,
    height: Math.round(rect.height * 100) / 100,
    margin,
    border,
    padding,
    content: {
      width: Math.round(content.width * 100) / 100,
      height: Math.round(content.height * 100) / 100,
    },
    boundingBox: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
  };
}

export function getContainerContext(el: HTMLElement): ContainerLayoutContext {
  const parent = el.parentElement;
  if (!parent) {
    return {
      parentTagName: 'none',
      parentSelector: 'none',
      display: 'none',
      position: 'static',
      isFlexChild: false,
      isGridChild: false,
    };
  }

  const parentCs = window.getComputedStyle(parent);
  const isFlex = parentCs.display.includes('flex');
  const isGrid = parentCs.display.includes('grid');

  const context: ContainerLayoutContext = {
    parentTagName: parent.tagName.toLowerCase(),
    parentSelector: getUniqueSelector(parent),
    display: parentCs.display,
    position: parentCs.position,
    isFlexChild: isFlex,
    isGridChild: isGrid,
  };

  if (isFlex) {
    context.flexParent = {
      flexDirection: parentCs.flexDirection,
      justifyContent: parentCs.justifyContent,
      alignItems: parentCs.alignItems,
      flexWrap: parentCs.flexWrap,
      gap: parentCs.gap || 'normal',
      rowGap: parentCs.rowGap || 'normal',
      columnGap: parentCs.columnGap || 'normal',
    };
  }

  if (isGrid) {
    context.gridParent = {
      gridTemplateColumns: parentCs.gridTemplateColumns,
      gridTemplateRows: parentCs.gridTemplateRows,
      gridAutoFlow: parentCs.gridAutoFlow,
      gap: parentCs.gap || 'normal',
    };
  }

  return context;
}

export function diagnoseLayoutBugs(el: HTMLElement): LayoutBugReport {
  const warnings: string[] = [];
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  const viewportWidth = window.innerWidth;
  const docScrollWidth = document.documentElement.scrollWidth;
  const docClientWidth = document.documentElement.clientWidth;

  // 1. Horizontal scroll leak detection
  let hasHorizontalScrollLeak = false;
  if (docScrollWidth > docClientWidth + 2) {
    // There is active horizontal overflow on document
    if (rect.right > docClientWidth) {
      hasHorizontalScrollLeak = true;
      warnings.push(`Element right edge (${Math.round(rect.right)}px) leaks beyond document width (${docClientWidth}px), causing horizontal scroll.`);
    }
  }

  // 2. Ancestor clipping
  let isClippedByAncestor = false;
  let clippingAncestorSelector: string | undefined;

  let current = el.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const parentCs = window.getComputedStyle(current);
    const parentRect = current.getBoundingClientRect();

    const isClippingOverflow =
      parentCs.overflow === 'hidden' ||
      parentCs.overflowX === 'hidden' ||
      parentCs.overflowY === 'hidden' ||
      parentCs.overflow === 'clip';

    if (isClippingOverflow) {
      const topClipped = rect.top < parentRect.top;
      const bottomClipped = rect.bottom > parentRect.bottom;
      const leftClipped = rect.left < parentRect.left;
      const rightClipped = rect.right > parentRect.right;

      if (topClipped || bottomClipped || leftClipped || rightClipped) {
        isClippedByAncestor = true;
        clippingAncestorSelector = getUniqueSelector(current);
        warnings.push(`Element is clipped by ancestor <${current.tagName.toLowerCase()}> with overflow: ${parentCs.overflow}.`);
        break;
      }
    }
    current = current.parentElement;
  }

  // 3. Z-Index conflict & stacking context
  const zIndexVal = cs.zIndex;
  const hasZIndex = zIndexVal !== 'auto' && zIndexVal !== '0';
  const zIndexParentStack: string[] = [];

  let zWalker = el.parentElement;
  while (zWalker && zWalker !== document.body) {
    const wCs = window.getComputedStyle(zWalker);
    if (wCs.zIndex !== 'auto') {
      zIndexParentStack.push(`${zWalker.tagName.toLowerCase()} (z-index: ${wCs.zIndex})`);
    }
    zWalker = zWalker.parentElement;
  }

  // 4. Safe-Area / Edge warning
  let safeAreaWarning: string | undefined;
  if (rect.left < 8 && rect.width > 0) {
    safeAreaWarning = `Element touches or sits extremely close to left viewport edge (${Math.round(rect.left)}px).`;
  } else if (viewportWidth - rect.right < 8 && rect.width > 0) {
    safeAreaWarning = `Element touches or sits extremely close to right viewport edge (${Math.round(viewportWidth - rect.right)}px).`;
  }

  return {
    hasHorizontalScrollLeak,
    isClippedByAncestor,
    clippingAncestorSelector,
    hasZIndexConflict: hasZIndex && zIndexParentStack.length > 0,
    zIndex: zIndexVal,
    zIndexParentStack: zIndexParentStack.length > 0 ? zIndexParentStack : undefined,
    safeAreaWarning,
    warnings,
  };
}

export function getUniqueSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  if (el.dataset && el.dataset.testid) {
    return `[data-testid="${el.dataset.testid}"]`;
  }

  const path: string[] = [];
  let curr: HTMLElement | null = el;

  while (curr && curr !== document.body && curr !== document.documentElement) {
    let selector = curr.tagName.toLowerCase();

    if (curr.id) {
      selector += `#${CSS.escape(curr.id)}`;
      path.unshift(selector);
      break;
    }

    if (curr.classList.length > 0) {
      // Pick first 2 representative classes
      const meaningfulClasses = Array.from(curr.classList)
        .filter((c) => !c.startsWith('letme-') && !c.includes(':'))
        .slice(0, 2);
      if (meaningfulClasses.length > 0) {
        selector += `.${meaningfulClasses.map((c) => CSS.escape(c)).join('.')}`;
      }
    }

    // Check if selector alone is unique among siblings
    const parent = curr.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === curr!.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(curr) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    curr = curr.parentElement;
  }

  return path.join(' > ');
}

export function getCleanHtmlSnippet(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;

  // Remove scripts, styles, and letme elements
  const toRemove = clone.querySelectorAll('script, style, [class*="letme-"]');
  toRemove.forEach((n) => n.remove());

  // Truncate deeply nested children if huge
  const children = Array.from(clone.children);
  if (children.length > 10) {
    for (let i = 10; i < children.length; i++) {
      children[i].remove();
    }
    const note = document.createElement('div');
    note.innerText = `<!-- ... ${children.length - 10} more sibling elements truncated ... -->`;
    clone.appendChild(note);
  }

  const rawHtml = clone.outerHTML;
  // If HTML is excessively long (> 4000 chars), truncate gracefully
  if (rawHtml.length > 4000) {
    return rawHtml.substring(0, 3950) + '\n<!-- ... content truncated for brevity ... -->';
  }
  return rawHtml;
}

export function getKeyComputedStyles(el: HTMLElement): Record<string, string> {
  const cs = window.getComputedStyle(el);
  const keys = [
    'display',
    'position',
    'box-sizing',
    'width',
    'height',
    'min-width',
    'max-width',
    'min-height',
    'max-height',
    'margin',
    'padding',
    'border',
    'border-radius',
    'background-color',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'text-align',
    'flex-direction',
    'justify-content',
    'align-items',
    'gap',
    'overflow',
    'z-index',
    'opacity',
    'transform',
  ];

  const result: Record<string, string> = {};
  for (const key of keys) {
    const val = cs.getPropertyValue(key);
    if (val && val !== 'none' && val !== 'normal' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)') {
      result[key] = val;
    }
  }

  return result;
}
