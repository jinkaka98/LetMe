import { SourceContextInfo } from '@letme/shared';

interface FiberNode {
  type?: any;
  elementType?: any;
  return?: FiberNode | null;
  _debugOwner?: FiberNode | null;
  _debugSource?: { fileName?: string; lineNumber?: number };
  _source?: { fileName?: string; lineNumber?: number };
}

function getParentAcrossShadow(el: Element): Element | null {
  if (el.parentElement) return el.parentElement;
  const root = el.getRootNode?.();
  return root instanceof ShadowRoot ? root.host : null;
}

function findElementDeep(selector: string): Element | null {
  const direct = document.querySelector(selector);
  if (direct) return direct;
  const searchRoot = (root: Document | ShadowRoot): Element | null => {
    const all = root.querySelectorAll('*');
    for (const node of Array.from(all)) {
      if (node.shadowRoot) {
        const hit = node.shadowRoot.querySelector(selector) || searchRoot(node.shadowRoot);
        if (hit) return hit;
      }
    }
    return null;
  };
  try {
    return searchRoot(document);
  } catch {
    return null;
  }
}

function getFiberComponentName(fiber: FiberNode | null | undefined): string | null {
  const type = fiber?.type;
  if (!type || typeof type === 'string') return null;
  const raw = type.displayName || type.name || type.render?.displayName || type.render?.name || null;
  if (!raw || raw.length <= 2 || !/^[A-Z]/.test(raw)) return null;
  return raw;
}

function extractReactSource(el: Element): SourceContextInfo | null {
  let curr: Element | null = el;
  let hops = 0;
  let fiber: FiberNode | undefined;

  while (curr && hops < 10) {
    const key = Object.keys(curr).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance') || k.startsWith('_reactInternalFiber'),
    );
    if (key) {
      fiber = (curr as unknown as Record<string, FiberNode>)[key];
      break;
    }
    curr = getParentAcrossShadow(curr);
    hops++;
  }

  if (!fiber) return null;

  let source: { fileName?: string; lineNumber?: number } | null = null;
  let cursor: FiberNode | null | undefined = fiber;
  for (let i = 0; i < 30 && cursor; i++) {
    const candidate =
      cursor._debugSource ||
      cursor._source ||
      cursor.elementType?._source ||
      cursor.type?._source ||
      cursor._debugOwner?._debugSource ||
      cursor._debugOwner?._source;
    if (candidate?.fileName) {
      source = candidate;
      break;
    }
    cursor = cursor.return || cursor._debugOwner;
  }

  let componentName: string | undefined;
  let compCursor: FiberNode | null | undefined = fiber;
  for (let i = 0; i < 30 && compCursor; i++) {
    if (typeof compCursor.type === 'function') {
      const name = getFiberComponentName(compCursor);
      if (name) {
        componentName = name;
        break;
      }
    }
    compCursor = compCursor.return;
  }

  const ownerChain: string[] = [];
  let ownerCursor: FiberNode | null | undefined = fiber;
  for (let i = 0; i < 12 && ownerCursor; i++) {
    const name = getFiberComponentName(ownerCursor);
    if (name && !ownerChain.includes(name)) ownerChain.unshift(name);
    ownerCursor = ownerCursor._debugOwner;
  }

  if (!componentName && !source?.fileName && ownerChain.length === 0) return null;
  return {
    framework: 'react',
    componentName,
    ownerChain: ownerChain.length > 0 ? ownerChain : undefined,
    filePath: source?.fileName,
    lineRange: source?.lineNumber ? `${source.lineNumber}-${source.lineNumber + 10}` : undefined,
  };
}

function extractVueSource(el: Element): SourceContextInfo | null {
  let curr: Element | null = el;
  let hops = 0;
  while (curr && hops < 10) {
    const anyEl = curr as unknown as Record<string, any>;
    const comp = anyEl.__vueParentComponent || anyEl.__vue__;
    if (comp) {
      const type = comp.type || comp.$options || {};
      const filePath: string | undefined = type.__file || comp.$options?.__file;
      const componentName: string | undefined = type.name || type.__name || comp.$options?.name;
      if (filePath || componentName) {
        return {
          framework: 'vue',
          componentName,
          ownerChain: componentName ? [componentName] : undefined,
          filePath,
        };
      }
    }
    curr = getParentAcrossShadow(curr);
    hops++;
  }
  return null;
}

if (!(window as unknown as Record<string, boolean>).__letmeMainBridgeInstalled) {
  (window as unknown as Record<string, boolean>).__letmeMainBridgeInstalled = true;
  document.addEventListener('letme-bridge:request', (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string; marker?: string }>).detail;
    if (!detail?.id || !detail?.marker) return;
    let result: SourceContextInfo | null = null;
    try {
      const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(detail.marker) : detail.marker;
      const target = findElementDeep(`[data-letme-probe="${escaped}"]`);
      if (target) {
        result = extractReactSource(target) || extractVueSource(target);
      }
    } catch {
      result = null;
    }
    document.dispatchEvent(
      new CustomEvent('letme-bridge:response', {
        detail: { id: detail.id, result },
      }),
    );
  });
}
