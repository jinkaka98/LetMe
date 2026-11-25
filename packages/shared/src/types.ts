export interface BoxModelMetrics {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  border: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  content: { width: number; height: number };
  boundingBox: {
    x: number;
    y: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface FlexContainerContext {
  flexDirection: string;
  justifyContent: string;
  alignItems: string;
  flexWrap: string;
  gap: string;
  rowGap: string;
  columnGap: string;
}

export interface GridContainerContext {
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridAutoFlow: string;
  gap: string;
}

export interface ContainerLayoutContext {
  parentTagName: string;
  parentSelector: string;
  display: string;
  position: string;
  isFlexChild: boolean;
  isGridChild: boolean;
  flexParent?: FlexContainerContext;
  gridParent?: GridContainerContext;
}

export interface LayoutBugReport {
  hasHorizontalScrollLeak: boolean;
  isClippedByAncestor: boolean;
  clippingAncestorSelector?: string;
  hasZIndexConflict: boolean;
  zIndex: string;
  zIndexParentStack?: string[];
  safeAreaWarning?: string;
  warnings: string[];
}

export interface MarkupPoint {
  x: number;
  y: number;
}

export interface MarkupAnnotation {
  id: string;
  type:
    | 'pen'
    | 'arrow'
    | 'box'
    | 'rounded-box'
    | 'circle'
    | 'diamond'
    | 'triangle'
    | 'callout'
    | 'line'
    | 'text'
    | 'ruler'
    | 'blur';
  color?: string;
  strokeWidth?: number;
  points?: MarkupPoint[]; // For pen
  startPoint?: MarkupPoint; // For arrow, box, ruler, blur
  endPoint?: MarkupPoint;
  text?: string; // For text annotation or ruler distance label
  fontFamily?: string; // For text annotation
  blurArea?: { x: number; y: number; width: number; height: number };
  rotation?: number; // Radians
}

export interface McpSnapshotSummary {
  id: string;
  timestamp: number;
  tagName: string;
  selector: string;
  url: string;
  userInstructions?: string;
  userBugNotes?: string;
}

export interface ConsoleLogEntry {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  stack?: string;
}

export interface LayerSnapshotDetail {
  index: number;
  tag: 'bug' | 'design' | 'edit' | 'note';
  selector: string;
  tagName: string;
  note?: string;
  outerHtmlSnippet: string;
  innerTextSnippet?: string;
  boxModel: BoxModelMetrics;
  layoutContext: ContainerLayoutContext;
  layoutBugs: LayoutBugReport;
  computedStyles: Record<string, string>;
  annotations: MarkupAnnotation[];
}

export interface ElementSnapshot {
  id: string;
  timestamp: number;
  url: string;
  pageTitle: string;
  selector: string;
  tagName: string;
  idAttribute?: string;
  classNames: string[];
  outerHtmlSnippet: string;
  innerTextSnippet?: string;
  boxModel: BoxModelMetrics;
  layoutContext: ContainerLayoutContext;
  layoutBugs: LayoutBugReport;
  computedStyles: Record<string, string>;
  screenshotBase64?: string; // PNG base64 cropped to element + annotations
  fullViewportScreenshotBase64?: string;
  userInstructions?: string;
  userBugNotes?: string;
  globalInstructions?: string;
  layers?: LayerSnapshotDetail[];
  annotations: MarkupAnnotation[];
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
}

export interface LivePreviewRequest {
  id: string;
  selector: string;
  cssRules: Record<string, string>;
  customStyleTagId?: string;
}

export interface LivePreviewResult {
  success: boolean;
  id: string;
  selector: string;
  message?: string;
}

export type ShortcutActionId =
  | 'inspect'
  | 'pickAi'
  | 'screenshot';

export interface CustomShortcutsConfig {
  inspect: string;
  pickAi: string;
  screenshot: string;
  screenshotMode: 'area' | 'full';
}

export const DEFAULT_CUSTOM_SHORTCUTS: CustomShortcutsConfig = {
  inspect: 'Alt+Shift+I',
  pickAi: 'Alt+Shift+A',
  screenshot: 'Alt+Shift+S',
  screenshotMode: 'area',
};
