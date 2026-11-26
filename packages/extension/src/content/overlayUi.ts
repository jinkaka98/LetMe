import {
  BoxModelMetrics,
  LayoutBugReport,
  MarkupAnnotation,
  McpSnapshotSummary,
  SemanticAnchors,
  SourceContextInfo,
} from '@letme/shared';
import { MarkupTool } from './markupStudio.js';
import { getLucideSvg } from '../icons.js';
import { ScreenshotLayerItem } from './scrEditorModal.js';

export type LayerTag = 'bug' | 'design' | 'edit' | 'note';
export type StudioTool = 'idle' | 'pick' | 'hand' | Exclude<MarkupTool, 'select'>;
export type ShapeToolId = 'box' | 'rounded-box' | 'circle' | 'diamond' | 'triangle' | 'callout';
export type InspectorTab = 'layers' | 'scr' | 'ai';
export type ScrCaptureMode = 'area' | 'full' | 'layer' | 'delay';

export interface ScrConfig {
  includeMarkup: boolean;
  hideHud: boolean;
  padding: 0 | 16 | 32;
  format: 'png' | 'jpeg';
  autoCopy: boolean;
}

export interface CopyHistoryItem {
  id: string;
  timestamp: number;
  layerCount: number;
  summary: string;
  text: string;
}

export interface PickedLayer {
  id: string;
  index: number;
  element: HTMLElement;
  selector: string;
  tagName: string;
  boxModel: BoxModelMetrics;
  layoutBugs: LayoutBugReport;
  tag: LayerTag;
  note: string;
  visible: boolean;
  thumbnailDataUrl?: string;
  sourceContext?: SourceContextInfo;
  semanticAnchors?: SemanticAnchors;
  annotations: MarkupAnnotation[];
}

export interface StudioViewState {
  layers: PickedLayer[];
  activeLayerId: string | null;
  activeTool: StudioTool;
  activeShape: ShapeToolId;
  activeColor: string;
  activeStrokeWidth: number;
  activeFontFamily: string;
  multiPick: boolean;
  isDrawerOpen: boolean;
  isPropsOpen: boolean;
  isToolbarCollapsed: boolean;
  showAllPins: boolean;
  isFinalNotesOpen: boolean;
  openModal: 'shapes' | 'color' | 'raw' | null;
  rawPreviewText: string;
  finalInstructions: string;
  isRightSliderOpen: boolean;
  rightSliderTab: 'mcp' | 'history';
  inspectorTab: InspectorTab;
  scrConfig: ScrConfig;
  screenshots: ScreenshotLayerItem[];
  aiSummary: { provider: string; model: string; hasKey: boolean };
  mcpSnapshots: McpSnapshotSummary[];
  copyHistory: CopyHistoryItem[];
}

export interface OverlayCallbacks {
  onSelectLayer: (layerId: string) => void;
  onCopyLayer: (layerId: string) => void;
  onOpenLayerRaw: (layerId: string) => void;
  onSwitchInspectorTab: (tab: InspectorTab) => void;
  onRunScrCapture: (mode: ScrCaptureMode) => void;
  onToggleScrOption: (key: 'includeMarkup' | 'hideHud' | 'autoCopy') => void;
  onCycleScrPadding: () => void;
  onToggleScrFormat: () => void;
  onEditScreenshot: (id: string) => void;
  onCopyScreenshot: (id: string) => void;
  onDownloadScreenshot: (id: string) => void;
  onSendScreenshotToAi: (id: string) => void;
  onDeleteScreenshot: (id: string) => void;
  onRunAiVisionScan: () => void;
  onOpenFullRaw: () => void;
  onDeleteLayer: (layerId: string) => void;
  onClearAllLayers: () => void;
  onToggleLayerVisible: (layerId: string) => void;
  onUpdateLayerTag: (layerId: string, tag: LayerTag) => void;
  onUpdateLayerNote: (layerId: string, note: string) => void;
  onToggleFinalNotes: () => void;
  onUpdateFinalInstructions: (text: string) => void;
  onCloseProps: () => void;
  onSetTool: (tool: StudioTool) => void;
  onSelectShape: (shape: ShapeToolId) => void;
  onSetColor: (color: string) => void;
  onSetStrokeWidth: (width: number) => void;
  onSetFontFamily: (font: string) => void;
  onToggleModal: (modal: 'shapes' | 'color' | 'raw' | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearMarkup: () => void;
  onToggleMultiPick: () => void;
  onToggleDrawer: () => void;
  onToggleToolbar: () => void;
  onToggleAllPins: () => void;
  onToggleRightSlider: () => void;
  onSwitchRightTab: (tab: 'mcp' | 'history') => void;
  onRefreshMcpSnapshots: () => void;
  onDeleteMcpSnapshot: (id: string) => void;
  onRecopyHistoryItem: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onCopyPrompt: () => void;
  onSendToAi: () => void;
  onClose: () => void;
}

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Montserrat', value: '"Montserrat", "Segoe UI", sans-serif' },
  { label: 'Poppins', value: '"Poppins", "Segoe UI", sans-serif' },
  { label: 'Calibri', value: 'Calibri, "Segoe UI", sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: '4-Bit', value: '"Press Start 2P", "Courier New", monospace' },
];

const COLOR_PRESETS = [
  '#ffffff', '#a1a1aa', '#ef4444', '#f97316',
  '#f59e0b', '#10b981', '#38bdf8', '#a855f7',
];

const HAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`;
const ERASER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`;
const REDO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14 20 9l-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/></svg>`;
const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const LOCK_CENSOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const EXIT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`;
const SIDEBAR_RIGHT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="3"/><path d="M15 3v18"/></svg>`;
const CIRCLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
const ROUNDED_BOX_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/></svg>`;
const DIAMOND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 12 12 22 2 12"/></svg>`;
const TRIANGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 3 22 20 2 20"/></svg>`;
const CALLOUT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="6"/></svg>`;

const SHAPE_OPTIONS: { id: ShapeToolId; title: string; icon: string }[] = [
  { id: 'box', title: 'Box', icon: getLucideSvg('square', { size: 16 }) },
  { id: 'rounded-box', title: 'Rounded Box', icon: ROUNDED_BOX_SVG },
  { id: 'circle', title: 'Circle / Ellipse', icon: CIRCLE_SVG },
  { id: 'diamond', title: 'Diamond', icon: DIAMOND_SVG },
  { id: 'triangle', title: 'Triangle', icon: TRIANGLE_SVG },
  { id: 'callout', title: 'Pill', icon: CALLOUT_SVG },
];

const HUD_CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

  .hud-card {
    background-color: #08080a;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 16px 16px;
    border: 1px solid #3f3f46;
    color: #fafafa;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.88);
  }

  .hud-menu-btn {
    position: fixed; top: 16px; left: 16px; z-index: 2147483647;
    width: 38px; height: 38px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
  }
  .hud-menu-btn:hover, .hud-menu-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }

  .hud-right-toggle {
    position: fixed; top: 16px; right: 16px; z-index: 2147483647;
    height: 38px; padding: 0 10px; border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    cursor: pointer; font-size: 11px; font-weight: 700;
  }
  .hud-right-toggle:hover { border-color: #ffffff; }

  .hud-toolbar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    display: inline-flex; align-items: center; gap: 2px; padding: 4px 6px; border-radius: 10px;
    max-width: calc(100vw - 140px); overflow-x: auto;
  }
  .hud-toolbar-collapsed {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px;
  }
  .hud-toolbar-collapsed:hover { border-color: #ffffff; }
  .hud-toolbar-collapsed img { width: 18px; height: 18px; border-radius: 4px; display: block; }

  .tb-btn {
    position: relative; width: 30px; height: 30px; border-radius: 7px;
    border: 1px solid transparent; background: transparent; color: #d4d4d8;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .tb-btn:hover { background: #18181b; color: #ffffff; border-color: #3f3f46; }
  .tb-btn.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .tb-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
  .tb-key {
    position: absolute; bottom: 1px; right: 2px; font-size: 8px; font-weight: 700;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; opacity: 0.72; line-height: 1;
  }
  .tb-sep { width: 1px; height: 20px; background: #27272a; margin: 0 3px; flex-shrink: 0; }

  .color-trigger {
    width: 20px; height: 20px; border-radius: 9999px; border: 2px solid #ffffff;
    cursor: pointer; margin: 0 3px; flex-shrink: 0;
  }
  .px-stepper {
    display: inline-flex; align-items: center; gap: 2px; padding: 2px 4px;
    border: 1px solid #3f3f46; border-radius: 6px; background: #050505; flex-shrink: 0;
  }
  .px-val {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; font-weight: 700; color: #ffffff; min-width: 24px; text-align: center;
  }
  .px-arrows { display: flex; flex-direction: column; gap: 1px; }
  .px-arr-btn {
    width: 14px; height: 10px; border: none; background: #18181b; color: #d4d4d8;
    font-size: 7px; line-height: 1; cursor: pointer; border-radius: 2px;
    display: flex; align-items: center; justify-content: center; padding: 0;
  }
  .px-arr-btn:hover { background: #ffffff; color: #000000; }
  .font-select {
    background: #050505; border: 1px solid #3f3f46; border-radius: 6px;
    color: #ffffff; font-size: 10px; font-weight: 600; padding: 4px 6px;
    outline: none; cursor: pointer; max-width: 92px; flex-shrink: 0;
  }
  .font-select:focus { border-color: #ffffff; }

  /* Popover Modals (Shapes & Color) */
  .tb-popover {
    position: fixed; top: 62px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
    padding: 10px 12px; border-radius: 10px; min-width: 196px;
  }
  .pop-title {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px;
    color: #a1a1aa; margin-bottom: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    display: flex; justify-content: space-between; align-items: center;
  }
  .shapes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .shape-opt {
    display: flex; align-items: center; justify-content: center;
    height: 38px; border-radius: 7px; border: 1px solid #2e2e32;
    background: #050505; color: #d4d4d8; cursor: pointer;
  }
  .shape-opt:hover { border-color: #ffffff; color: #ffffff; }
  .shape-opt.active { background: #ffffff; color: #000000; border-color: #ffffff; }

  .color-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; justify-items: center; }
  .color-cell {
    width: 26px; height: 26px; border-radius: 9999px; border: 1.5px solid #3f3f46; cursor: pointer; padding: 0;
  }
  .color-cell.active { border-color: #ffffff; box-shadow: 0 0 0 2px #050505, 0 0 0 3.5px #ffffff; }
  .color-custom-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #d4d4d8; }
  .color-native { width: 26px; height: 26px; border: 1px solid #3f3f46; border-radius: 9999px; background: none; padding: 0; cursor: pointer; overflow: hidden; }
  .hex-input {
    width: 84px; background: #050505; border: 1px solid #3f3f46; border-radius: 5px;
    color: #ffffff; padding: 4px 6px; font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; outline: none;
  }
  .hex-input:focus { border-color: #ffffff; }

  .close-sym {
    background: #121215; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 5px;
    width: 22px; height: 22px; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center; line-height: 1;
  }
  .close-sym:hover { background: #ffffff; color: #000000; border-color: #ffffff; }

  /* Left Layers Drawer */
  .hud-drawer {
    position: fixed; top: 62px; left: 16px; z-index: 2147483647;
    width: 356px; max-height: calc(100vh - 84px); border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden; font-size: 12px;
  }
  .drawer-head {
    padding: 9px 12px; background: #050505; border-bottom: 1px dashed #2e2e32;
    display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .brand-wrap { display: flex; align-items: center; gap: 6px; }
  .brand-logo { width: 18px; height: 18px; border-radius: 4px; display: block; }
  .brand-title { font-weight: 700; font-size: 12px; color: #ffffff; }
  .toggle-chip {
    background: #121215; border: 1px solid #3f3f46; color: #fafafa; border-radius: 4px;
    padding: 3px 7px; font-size: 10px; font-weight: 600; cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  }
  .toggle-chip:hover { border-color: #ffffff; }
  .toggle-chip.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .toggle-chip.danger:hover { border-color: #ef4444; color: #ef4444; }
  .drawer-body { padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .section-head {
    display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.7px; color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layers-box { border: 1px solid #2e2e32; border-radius: 6px; background: rgba(5,5,5,0.9); overflow: hidden; }
  .layers-empty { padding: 16px 12px; text-align: center; color: #71717a; font-size: 11px; }
  .layer-row {
    display: flex; align-items: center; gap: 6px; padding: 6px 8px;
    border-bottom: 1px solid #18181b; cursor: pointer;
  }
  .layer-row:last-child { border-bottom: none; }
  .layer-row:hover { background: #141418; }
  .layer-row.active { background: #1f1f24; border-left: 2px solid #ffffff; }
  .layer-eye { background: none; border: none; color: #a1a1aa; cursor: pointer; padding: 2px; display: inline-flex; flex-shrink: 0; }
  .layer-eye.off { opacity: 0.35; }
  .layer-thumb {
    width: 40px; height: 26px; border-radius: 4px; border: 1px solid #3f3f46; background: #000000;
    overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: #71717a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layer-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .layer-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .layer-top { display: flex; align-items: center; gap: 5px; }
  .layer-idx {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 700;
    color: #000000; background: #ffffff; border-radius: 3px; padding: 1px 4px; flex-shrink: 0;
  }
  .layer-name {
    flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #fafafa;
  }
  .layer-sub {
    display: flex; align-items: center; gap: 6px; font-size: 9px; color: #a1a1aa;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layer-tag-badge {
    font-size: 8px; font-weight: 700; text-transform: uppercase; padding: 1px 4px;
    border-radius: 3px; border: 1px solid #3f3f46; background: #050505; color: #d4d4d8;
  }
  .layer-raw-btn {
    background: #121215; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 700;
    padding: 2px 5px; cursor: pointer; flex-shrink: 0;
  }
  .layer-raw-btn:hover { background: #ffffff; color: #000000; border-color: #ffffff; }
  .layer-trash {
    background: none; border: none; color: #71717a; cursor: pointer; padding: 3px;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: 4px;
  }
  .layer-trash:hover { color: #ef4444; background: #18181b; }

  .final-notes-wrap { border-top: 1px dashed #2e2e32; padding-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .final-toggle-btn {
    width: 100%; background: #050505; border: 1px solid #2e2e32; color: #d4d4d8; border-radius: 5px;
    padding: 5px 8px; font-size: 10px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: space-between;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .final-toggle-btn:hover { border-color: #ffffff; color: #ffffff; }

  /* Side-by-Side Properties Modal */
  .hud-props-modal {
    position: fixed; top: 62px; left: 380px; z-index: 2147483647;
    width: 300px; max-height: calc(100vh - 84px); border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden; font-size: 12px;
  }
  .props-body { padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 9px; }
  .props-preview {
    width: 100%; height: 108px; border-radius: 6px; border: 1px solid #3f3f46; background: #000000;
    overflow: hidden; display: flex; align-items: center; justify-content: center; color: #71717a; font-size: 10px;
  }
  .props-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .props-meta { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #a1a1aa; line-height: 1.45; }
  .props-meta b { color: #ffffff; }
  .bug-alert { padding: 6px 8px; border: 1px dashed #ffffff; border-radius: 4px; background: #121215; font-size: 10px; color: #e4e4e7; }
  .tag-pills { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .tag-pill {
    padding: 4px 6px; border-radius: 4px; border: 1px solid #2e2e32; background: #050505;
    color: #a1a1aa; font-size: 10px; font-weight: 600; text-transform: uppercase; cursor: pointer; text-align: center;
  }
  .tag-pill.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .note-input {
    width: 100%; min-height: 60px; background: #050505; border: 1px solid #2e2e32;
    border-radius: 5px; color: #fafafa; padding: 6px 8px; font-size: 11px; resize: vertical; outline: none;
  }
  .note-input:focus { border-color: #ffffff; }

  /* Raw Preview Modal */
  .raw-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2147483647;
    width: 480px; max-width: 92vw; max-height: 78vh; border-radius: 10px;
    display: flex; flex-direction: column; overflow: hidden;
  }
  .raw-pre {
    margin: 0; padding: 12px; background: #050505; color: #e4e4e7; font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;
    word-break: break-word; overflow-y: auto; max-height: 58vh;
  }

  /* Full-Height Right Slider */
  .hud-right-slider {
    position: fixed; top: 16px; right: 16px; bottom: 68px; z-index: 2147483647;
    width: 324px; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
  }
  .hud-exit-fab {
    position: fixed; bottom: 18px; right: 18px; z-index: 2147483647;
    width: 38px; height: 38px; border-radius: 9999px;
    background: #ef4444; border: 1.5px solid rgba(255, 255, 255, 0.85); color: #ffffff;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    opacity: 0.28; transition: opacity 0.18s ease, transform 0.15s ease, box-shadow 0.15s ease;
  }
  .hud-exit-fab:hover {
    opacity: 1; transform: scale(1.08);
    box-shadow: 0 8px 24px rgba(239, 68, 68, 0.55);
  }
  .studio-tabs {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
    padding: 6px 12px 0; background: #08080a;
  }
  .studio-tab {
    padding: 5px 6px; border-radius: 5px; border: 1px solid #27272a; background: #050505;
    color: #a1a1aa; font-size: 10px; font-weight: 700; cursor: pointer; text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .studio-tab:hover { color: #ffffff; border-color: #3f3f46; }
  .studio-tab.active { background: #ffffff; color: #000000; border-color: #ffffff; }
  .studio-panel-card {
    border: 1px solid #2e2e32; border-radius: 6px; background: rgba(5,5,5,0.92);
    padding: 10px; display: flex; flex-direction: column; gap: 8px;
  }
  .scr-row {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; color: #d4d4d8;
  }
  .rs-head {
    padding: 10px 12px; background: #050505; border-bottom: 1px dashed #2e2e32;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rs-output-box {
    padding: 10px 12px; background: #0a0a0c; border-bottom: 1px solid #27272a;
    display: flex; flex-direction: column; gap: 7px;
  }
  .rs-output-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .rs-btn-sec {
    padding: 7px 10px; background: #121215; border: 1px solid #3f3f46; border-radius: 6px;
    color: #fafafa; font-size: 11px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-sec:hover { border-color: #ffffff; }
  .rs-btn-pri {
    padding: 7px 10px; background: #ffffff; border: 1px solid #ffffff; border-radius: 6px;
    color: #000000; font-size: 11px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-pri:hover { background: #e4e4e7; }
  .rs-btn-exit {
    padding: 6px 10px; background: #050505; border: 1px solid #3f3f46; border-radius: 6px;
    color: #fca5a5; font-size: 11px; font-weight: 600; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  }
  .rs-btn-exit:hover { border-color: #ef4444; background: #18181b; color: #ffffff; }

  .rs-tabs-bar {
    padding: 8px 12px 0; display: flex; align-items: center; justify-content: space-between; gap: 6px;
  }
  .mcp-sb-tabs {
    display: inline-flex; background: #121215; border: 1px solid #2e2e32; border-radius: 7px; padding: 2px; gap: 2px; flex: 1;
  }
  .mcp-sb-tab {
    flex: 1; padding: 5px 8px; border-radius: 5px; border: none; background: transparent; color: #a1a1aa;
    font-size: 10px; font-weight: 700; cursor: pointer; text-align: center;
  }
  .mcp-sb-tab.active { background: #ffffff; color: #000000; }

  .mcp-sb-empty {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 24px; gap: 8px; color: #a1a1aa;
  }
  .mcp-sb-empty h4 { margin: 0; font-size: 13px; color: #ffffff; }
  .mcp-sb-empty p { margin: 0; font-size: 11px; color: #71717a; line-height: 1.4; }
  .mcp-item { padding: 8px 10px; border-bottom: 1px solid #18181b; display: flex; flex-direction: column; gap: 4px; }
  .mcp-item:last-child { border-bottom: none; }
  .mcp-item-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .mcp-item-sel {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #ffffff;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }
  .mcp-item-note { font-size: 10px; color: #a1a1aa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;

export class OverlayUi {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private callbacks: OverlayCallbacks;
  private statusInterval: any = null;
  private statusListener: any = null;
  private mcpConnected = false;

  constructor(callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
  }

  render(state: StudioViewState) {
    if (!this.host || !this.shadow) {
      this.host = document.createElement('div');
      this.host.id = 'letme-inspector-overlay-root';
      this.shadow = this.host.attachShadow({ mode: 'open' });
      document.body.appendChild(this.host);
      this.startStatusSync();
    }

    const activeLayer = state.layers.find((l) => l.id === state.activeLayerId) || null;
    const isShapeActive = SHAPE_OPTIONS.some((s) => s.id === state.activeTool);
    const activeShapeMeta = SHAPE_OPTIONS.find((s) => s.id === state.activeShape) || SHAPE_OPTIONS[0];
    const logoUrl = chrome.runtime.getURL('icons/icon-32.png');

    const toolbarHtml = state.isToolbarCollapsed
      ? `<button id="btn-expand-tb" class="hud-card hud-toolbar-collapsed"><img src="${logoUrl}" alt="LetMe" /><span>LetMe</span><span>▾</span></button>`
      : `
        <div class="hud-card hud-toolbar">
          <button id="btn-lock-multi" class="tb-btn ${state.multiPick ? 'active' : ''}" title="Toggle Multi-Pick (${state.multiPick ? 'ON' : 'OFF'})">
            ${getLucideSvg('layers', { size: 15 })}
          </button>
          <div class="tb-sep"></div>
          <button class="tb-btn ${state.activeTool === 'hand' ? 'active' : ''}" data-tool="hand" title="Hand / Move & Resize (H)">
            ${HAND_SVG}<span class="tb-key">H</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'pick' ? 'active' : ''}" data-tool="pick" title="Pick Element (V)">
            ${getLucideSvg('mouse-pointer-click', { size: 15 })}<span class="tb-key">V</span>
          </button>
          <div class="tb-sep"></div>
          <button id="btn-shapes-modal" class="tb-btn ${isShapeActive ? 'active' : ''}" title="Select Shape">
            ${activeShapeMeta.icon}<span class="tb-key">S</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'arrow' ? 'active' : ''}" data-tool="arrow" title="Arrow (A)">
            ${getLucideSvg('arrow-right', { size: 15 })}<span class="tb-key">A</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'line' ? 'active' : ''}" data-tool="line" title="Line (L)">
            ${getLucideSvg('minus', { size: 15 })}<span class="tb-key">L</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'ruler' ? 'active' : ''}" data-tool="ruler" title="Ruler (R)">
            ${getLucideSvg('ruler', { size: 15 })}<span class="tb-key">R</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'pen' ? 'active' : ''}" data-tool="pen" title="Draw (B)">
            ${getLucideSvg('pencil', { size: 15 })}<span class="tb-key">B</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'text' ? 'active' : ''}" data-tool="text" title="Text (T)">
            ${getLucideSvg('type', { size: 15 })}<span class="tb-key">T</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'sticky' ? 'active' : ''}" data-tool="sticky" title="Sticky Note (N)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg><span class="tb-key">N</span>
          </button>
          <button class="tb-btn ${state.activeTool === 'blur' ? 'active' : ''}" data-tool="blur" title="Censored Blur (U)">
            ${LOCK_CENSOR_SVG}<span class="tb-key">U</span>
          </button>
          <div class="tb-sep"></div>
          <button id="btn-color-modal" class="color-trigger" style="background:${state.activeColor};" title="Pick Color"></button>
          <div class="px-stepper" title="Stroke / Text Size">
            <span class="px-val">${state.activeStrokeWidth}px</span>
            <div class="px-arrows">
              <button id="btn-px-up" class="px-arr-btn" title="Increase px">▲</button>
              <button id="btn-px-down" class="px-arr-btn" title="Decrease px">▼</button>
            </div>
          </div>
          ${
            state.activeTool === 'text'
              ? `<select id="select-font-family" class="font-select" title="Text Font Style">
                  ${FONT_OPTIONS.map(
                    (f) => `<option value="${this.escapeHtml(f.value)}" ${state.activeFontFamily === f.value ? 'selected' : ''}>${f.label}</option>`
                  ).join('')}
                </select>`
              : ''
          }
          <div class="tb-sep"></div>
          <button id="tb-toggle-pins" class="tb-btn ${state.showAllPins ? 'active' : ''}" title="Show/Hide All Layer Pins">
            ${EYE_SVG}
          </button>
          <button id="tb-undo" class="tb-btn" title="Undo">${getLucideSvg('undo-2', { size: 15 })}</button>
          <button id="tb-redo" class="tb-btn" title="Redo">${REDO_SVG}</button>
          <button class="tb-btn danger ${state.activeTool === 'eraser' ? 'active' : ''}" data-tool="eraser" title="Eraser: Click markup to delete (E)">
            ${ERASER_SVG}<span class="tb-key">E</span>
          </button>
          <button id="tb-clear-all" class="tb-btn danger" title="Clear All Markup on Layer">
            ${getLucideSvg('trash-2', { size: 15 })}
          </button>
          <button id="btn-collapse-tb" class="tb-btn" title="Hide Toolbar">
            ${getLucideSvg('chevron-up', { size: 15 })}
          </button>
        </div>
      `;

    let modalHtml = '';
    if (state.openModal === 'shapes') {
      modalHtml = `
        <div class="hud-card tb-popover">
          <div class="pop-title"><span>Select Shape</span><button id="btn-close-modal" class="close-sym">${getLucideSvg('x', { size: 12 })}</button></div>
          <div class="shapes-grid">
            ${SHAPE_OPTIONS.map(
              (s) => `<button class="shape-opt ${state.activeShape === s.id ? 'active' : ''}" data-shape="${s.id}" title="${s.title}">${s.icon}</button>`
            ).join('')}
          </div>
        </div>
      `;
    } else if (state.openModal === 'color') {
      modalHtml = `
        <div class="hud-card tb-popover">
          <div class="pop-title"><span>Color Picker</span><button id="btn-close-modal" class="close-sym">${getLucideSvg('x', { size: 12 })}</button></div>
          <div class="color-grid">
            ${COLOR_PRESETS.map(
              (c) => `<button class="color-cell ${state.activeColor.toLowerCase() === c ? 'active' : ''}" data-color="${c}" style="background:${c};"></button>`
            ).join('')}
          </div>
          <div class="color-custom-row">
            <input id="input-custom-color" class="color-native" type="color" value="${state.activeColor}" />
            <span>Code:</span>
            <input id="input-hex-color" class="hex-input" type="text" value="${state.activeColor}" maxlength="7" placeholder="#ffffff" />
          </div>
        </div>
      `;
    } else if (state.openModal === 'raw') {
      modalHtml = `
        <div class="hud-card raw-modal">
          <div class="drawer-head">
            <span class="brand-title">Raw Payload Preview</span>
            <button id="btn-close-modal" class="close-sym">${getLucideSvg('x', { size: 12 })}</button>
          </div>
          <pre class="raw-pre">${this.escapeHtml(state.rawPreviewText || 'No layers picked yet.')}</pre>
        </div>
      `;
    }

    const layersHtml =
      state.layers.length === 0
        ? `<div class="layers-empty">Click any element on the page to add a layer</div>`
        : state.layers
            .map((layer) => {
              const isActive = layer.id === state.activeLayerId;
              const thumbHtml = layer.thumbnailDataUrl
                ? `<img src="${layer.thumbnailDataUrl}" alt="Layer #${layer.index}" />`
                : `<span>#${layer.index}</span>`;
              return `
                <div class="layer-row ${isActive ? 'active' : ''}" data-layer-id="${layer.id}">
                  <button class="layer-eye ${layer.visible ? '' : 'off'}" data-eye-id="${layer.id}" title="Toggle Pin">
                    ${EYE_SVG}
                  </button>
                  <div class="layer-thumb">${thumbHtml}</div>
                  <div class="layer-info">
                    <div class="layer-top">
                      <span class="layer-name" style="font-weight:700;">Layer ${layer.index}</span>
                      <span class="layer-tag-badge">${layer.tag}</span>
                    </div>
                    <div class="layer-sub">
                      <span>&lt;${layer.tagName}&gt;</span>
                      <span>· ${layer.boxModel.width}×${layer.boxModel.height}</span>
                      <span>· ${layer.annotations.length} mark</span>
                    </div>
                  </div>
                  <button class="layer-trash" data-copy-id="${layer.id}" title="Copy Prompt for Layer ${layer.index}">${getLucideSvg('copy', { size: 12 })}</button>
                  <button class="layer-raw-btn" data-raw-id="${layer.id}" title="Preview Raw for Layer ${layer.index}">Raw</button>
                  <button class="layer-trash" data-del-id="${layer.id}" title="Delete Layer">${getLucideSvg('trash-2', { size: 13 })}</button>
                </div>
              `;
            })
            .join('');

    let drawerTabBody = '';
    if (state.inspectorTab === 'layers') {
      drawerTabBody = `
        <div class="section-head">
          <span>Layers (${state.layers.length})</span>
          <span>Click layer to edit</span>
        </div>
        <div class="layers-box">${layersHtml}</div>
        <div class="final-notes-wrap">
          <button id="btn-toggle-final-notes" class="final-toggle-btn">
            <span>Additional Final Instructions</span>
            <span>${state.isFinalNotesOpen ? '▴' : '▾'}</span>
          </button>
          ${
            state.isFinalNotesOpen
              ? `<textarea id="final-instructions-input" class="note-input" style="min-height:48px;" placeholder="Instruksi tambahan di akhir prompt (opsional)...">${this.escapeHtml(state.finalInstructions)}</textarea>`
              : ''
          }
        </div>
      `;
    } else if (state.inspectorTab === 'scr') {
      const scrListHtml =
        state.screenshots.length === 0
          ? `<div class="layers-empty">No screenshots captured yet. Use modes above!</div>`
          : state.screenshots
              .map(
                (s) => `
                <div class="layer-row">
                  <div class="layer-thumb"><img src="${s.dataUrl}" alt="${s.name}" /></div>
                  <div class="layer-info">
                    <div class="layer-top">
                      <span class="layer-name" style="font-weight:700;">${s.name}</span>
                      <span class="layer-tag-badge">${s.mode}</span>
                    </div>
                    <div class="layer-sub"><span>${s.width}×${s.height}px</span></div>
                  </div>
                  <button class="layer-raw-btn" data-scr-edit="${s.id}" title="Edit / Annotate">Edit</button>
                  <button class="layer-trash" data-scr-copy="${s.id}" title="Copy Image">${getLucideSvg('copy', { size: 12 })}</button>
                  <button class="layer-trash" data-scr-dl="${s.id}" title="Download">${getLucideSvg('download', { size: 12 })}</button>
                  <button class="layer-trash" data-scr-send="${s.id}" title="Send to AI">${getLucideSvg('zap', { size: 12 })}</button>
                  <button class="layer-trash" data-scr-del="${s.id}" title="Delete">${getLucideSvg('trash-2', { size: 12 })}</button>
                </div>
              `
              )
              .join('');

      drawerTabBody = `
        <div class="section-head"><span>Capture Modes</span><span>Pre-markup ready</span></div>
        <div class="studio-panel-card">
          <div class="rs-output-row">
            <button id="btn-scr-area" class="rs-btn-sec">${getLucideSvg('crop', { size: 13 })} Area Crop</button>
            <button id="btn-scr-full" class="rs-btn-pri">${getLucideSvg('maximize', { size: 13, color: '#000000' })} Full View</button>
          </div>
          <div class="rs-output-row">
            <button id="btn-scr-layer" class="rs-btn-sec">${getLucideSvg('layers', { size: 13 })} Active Layer</button>
            <button id="btn-scr-delay" class="rs-btn-sec">⏱ Delay 3s</button>
          </div>
          <div class="scr-row">
            <span>Include Canvas Markups</span>
            <button id="btn-scr-markup" class="toggle-chip ${state.scrConfig.includeMarkup ? 'active' : ''}">${state.scrConfig.includeMarkup ? 'ON' : 'OFF'}</button>
          </div>
          <div class="scr-row">
            <span>Hide Studio HUD</span>
            <button id="btn-scr-hidehud" class="toggle-chip ${state.scrConfig.hideHud ? 'active' : ''}">${state.scrConfig.hideHud ? 'ON' : 'OFF'}</button>
          </div>
          <div class="scr-row">
            <span>Layer Pad / Format / Copy</span>
            <div style="display:flex; gap:4px;">
              <button id="btn-scr-pad" class="toggle-chip">${state.scrConfig.padding}px</button>
              <button id="btn-scr-fmt" class="toggle-chip">${state.scrConfig.format.toUpperCase()}</button>
              <button id="btn-scr-autocopy" class="toggle-chip ${state.scrConfig.autoCopy ? 'active' : ''}">Copy</button>
            </div>
          </div>
        </div>
        <div class="section-head"><span>Screenshot Layers (${state.screenshots.length})</span><span>Click Edit to customize</span></div>
        <div class="layers-box">${scrListHtml}</div>
      `;
    } else {
      drawerTabBody = `
        <div class="section-head"><span>AI Vision Studio</span><span>${this.escapeHtml(state.aiSummary.provider)}</span></div>
        <div class="studio-panel-card">
          <div class="props-meta">
            Provider: <b>${this.escapeHtml(state.aiSummary.provider)}</b><br/>
            Model: <b>${this.escapeHtml(state.aiSummary.model)}</b><br/>
            API Key: <b>${state.aiSummary.hasKey ? 'Configured' : 'Not Set (Open Popup Settings)'}</b>
          </div>
          <button id="btn-run-ai-scan" class="rs-btn-pri" style="width:100%;">
            ${getLucideSvg('bot', { size: 14, color: '#000000' })} Scan Page with AI Vision
          </button>
        </div>
      `;
    }

    const drawerHtml = state.isDrawerOpen
      ? `
        <aside class="hud-card hud-drawer">
          <div class="drawer-head">
            <div class="brand-wrap">
              <img class="brand-logo" src="${logoUrl}" alt="LetMe" />
              <span class="brand-title">LetMe Studio</span>
            </div>
            <div style="display:flex; gap:4px; align-items:center;">
              <button id="btn-full-raw" class="toggle-chip" title="Preview Full Prompt">Raw</button>
              <button id="btn-drawer-multi" class="toggle-chip ${state.multiPick ? 'active' : ''}">${state.multiPick ? 'Multi' : 'Single'}</button>
              <button id="btn-clear-all-layers" class="toggle-chip danger" title="Clear All Layers">${getLucideSvg('trash-2', { size: 12 })}</button>
            </div>
          </div>
          <div class="studio-tabs">
            <button class="studio-tab ${state.inspectorTab === 'layers' ? 'active' : ''}" data-ins-tab="layers">Layers</button>
            <button class="studio-tab ${state.inspectorTab === 'scr' ? 'active' : ''}" data-ins-tab="scr">SCR</button>
            <button class="studio-tab ${state.inspectorTab === 'ai' ? 'active' : ''}" data-ins-tab="ai">AI Vision</button>
          </div>
          <div class="drawer-body">
            ${drawerTabBody}
          </div>
        </aside>
      `
      : '';

    const propsModalHtml =
      state.isDrawerOpen && state.isPropsOpen && activeLayer
        ? `
        <section class="hud-card hud-props-modal">
          <div class="drawer-head">
            <span class="brand-title">Properties · #${activeLayer.index} &lt;${activeLayer.tagName}&gt;</span>
            <button id="btn-close-props" class="close-sym" title="Close Properties">${getLucideSvg('x', { size: 12 })}</button>
          </div>
          <div class="props-body">
            <div class="props-preview">
              ${activeLayer.thumbnailDataUrl ? `<img src="${activeLayer.thumbnailDataUrl}" alt="Preview" />` : `<span>Capturing preview...</span>`}
            </div>
            <div class="props-meta">
              <b>${activeLayer.boxModel.width}×${activeLayer.boxModel.height}px</b> · Marks: <b>${activeLayer.annotations.length}</b><br/>
              Pad: ${activeLayer.boxModel.padding.top}/${activeLayer.boxModel.padding.right}/${activeLayer.boxModel.padding.bottom}/${activeLayer.boxModel.padding.left}
              · Mar: ${activeLayer.boxModel.margin.top}/${activeLayer.boxModel.margin.right}/${activeLayer.boxModel.margin.bottom}/${activeLayer.boxModel.margin.left}
            </div>
            ${activeLayer.layoutBugs.warnings.length > 0 ? `<div class="bug-alert">Alert: ${activeLayer.layoutBugs.warnings[0]}</div>` : ''}
            <div class="tag-pills">
              ${(['bug', 'design', 'edit', 'note'] as LayerTag[])
                .map((t) => `<button class="tag-pill ${activeLayer.tag === t ? 'active' : ''}" data-tag="${t}">${t}</button>`)
                .join('')}
            </div>
            <textarea id="layer-note-input" class="note-input" placeholder="Tulis instruksi untuk Layer #${activeLayer.index}...">${this.escapeHtml(activeLayer.note)}</textarea>
          </div>
        </section>
      `
        : '';

    const rightTabBody =
      state.rightSliderTab === 'mcp'
        ? state.mcpSnapshots.length === 0
          ? `<div class="mcp-sb-empty"><h4>No MCP data sent yet...</h4><p>Click <b>Send to AI</b> above to dispatch layers to MCP.</p></div>`
          : `<div class="drawer-body"><div class="layers-box">
              ${state.mcpSnapshots
                .map(
                  (s) => `
                  <div class="mcp-item">
                    <div class="mcp-item-top">
                      <span class="mcp-item-sel">&lt;${s.tagName}&gt; ${this.escapeHtml(s.selector)}</span>
                      <button class="layer-trash" data-mcp-del="${s.id}" title="Delete from MCP">${getLucideSvg('trash-2', { size: 12 })}</button>
                    </div>
                    <div class="mcp-item-note">${this.escapeHtml(s.userInstructions || s.userBugNotes || 'No note')}</div>
                  </div>
                `
                )
                .join('')}
            </div></div>`
        : state.copyHistory.length === 0
          ? `<div class="mcp-sb-empty"><h4>No copy history yet...</h4><p>Click <b>Copy</b> above to generate and save a structured prompt.</p></div>`
          : `<div class="drawer-body"><div class="layers-box">
              ${state.copyHistory
                .map(
                  (h) => `
                  <div class="mcp-item">
                    <div class="mcp-item-top">
                      <span class="mcp-item-sel">${h.layerCount} Layer(s) · ${new Date(h.timestamp).toLocaleTimeString()}</span>
                      <button class="layer-raw-btn" data-hist-copy="${h.id}" title="Copy Again">Copy</button>
                      <button class="layer-trash" data-hist-del="${h.id}" title="Delete">${getLucideSvg('trash-2', { size: 12 })}</button>
                    </div>
                    <div class="mcp-item-note">${this.escapeHtml(h.summary)}</div>
                  </div>
                `
                )
                .join('')}
            </div></div>`;

    const rightSliderHtml = state.isRightSliderOpen
      ? `
        <aside class="hud-card hud-right-slider">
          <div class="rs-head">
            <span class="brand-title">Right Slider · ${this.mcpConnected ? 'MCP Online' : 'MCP Offline'}</span>
            <button id="btn-rs-close" class="close-sym" title="Hide Right Slider">${getLucideSvg('x', { size: 12 })}</button>
          </div>
          <div class="rs-output-box">
            <div class="section-head"><span>Output</span><span>${state.layers.length} Layer(s)</span></div>
            <div class="rs-output-row">
              <button id="btn-copy" class="rs-btn-sec">${getLucideSvg('copy', { size: 12 })} Copy</button>
              <button id="btn-send" class="rs-btn-pri">${getLucideSvg('zap', { size: 12, color: '#000000' })} Send to AI</button>
            </div>
          </div>
          <div class="rs-tabs-bar">
            <div class="mcp-sb-tabs">
              <button id="tab-rs-mcp" class="mcp-sb-tab ${state.rightSliderTab === 'mcp' ? 'active' : ''}">MCP (${state.mcpSnapshots.length})</button>
              <button id="tab-rs-history" class="mcp-sb-tab ${state.rightSliderTab === 'history' ? 'active' : ''}">Copy (${state.copyHistory.length})</button>
            </div>
            ${state.rightSliderTab === 'mcp' ? `<button id="btn-mcp-refresh" class="toggle-chip" title="Refresh MCP">↻</button>` : ''}
          </div>
          ${rightTabBody}
        </aside>
      `
      : `
        <button id="btn-right-slider" class="hud-card hud-right-toggle" title="Right Slider">
          ${SIDEBAR_RIGHT_SVG}
          ${state.mcpSnapshots.length > 0 ? `<span>${state.mcpSnapshots.length}</span>` : ''}
        </button>
      `;

    this.shadow.innerHTML = `
      <style>${HUD_CSS}</style>
      <button id="btn-hud-menu" class="hud-card hud-menu-btn ${state.isDrawerOpen ? 'active' : ''}" title="Show/Hide Layers">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      </button>
      ${toolbarHtml}
      ${modalHtml}
      ${drawerHtml}
      ${propsModalHtml}
      ${rightSliderHtml}
      <button id="btn-floating-exit" class="hud-exit-fab" title="Close Pick Studio">${getLucideSvg('x', { size: 18, color: '#ffffff' })}</button>
    `;

    this.bindEvents(state);
  }

  private bindEvents(state: StudioViewState) {
    if (!this.shadow) return;

    this.shadow.getElementById('btn-hud-menu')?.addEventListener('click', () => this.callbacks.onToggleDrawer());
    this.shadow.getElementById('tb-toggle-pins')?.addEventListener('click', () => this.callbacks.onToggleAllPins());
    this.shadow.getElementById('btn-lock-multi')?.addEventListener('click', () => this.callbacks.onToggleMultiPick());
    this.shadow.getElementById('btn-drawer-multi')?.addEventListener('click', () => this.callbacks.onToggleMultiPick());
    this.shadow.getElementById('btn-clear-all-layers')?.addEventListener('click', () => this.callbacks.onClearAllLayers());
    this.shadow.getElementById('btn-full-raw')?.addEventListener('click', () => this.callbacks.onOpenFullRaw());
    this.shadow.getElementById('btn-toggle-final-notes')?.addEventListener('click', () => this.callbacks.onToggleFinalNotes());
    this.shadow.getElementById('btn-collapse-tb')?.addEventListener('click', () => this.callbacks.onToggleToolbar());
    this.shadow.getElementById('btn-expand-tb')?.addEventListener('click', () => this.callbacks.onToggleToolbar());
    this.shadow.getElementById('btn-px-up')?.addEventListener('click', () => this.callbacks.onSetStrokeWidth(state.activeStrokeWidth + 1));
    this.shadow.getElementById('btn-px-down')?.addEventListener('click', () => this.callbacks.onSetStrokeWidth(state.activeStrokeWidth - 1));
    this.shadow.getElementById('btn-shapes-modal')?.addEventListener('click', () => this.callbacks.onToggleModal(state.openModal === 'shapes' ? null : 'shapes'));
    this.shadow.getElementById('btn-color-modal')?.addEventListener('click', () => this.callbacks.onToggleModal(state.openModal === 'color' ? null : 'color'));
    this.shadow.getElementById('btn-close-modal')?.addEventListener('click', () => this.callbacks.onToggleModal(null));
    this.shadow.getElementById('btn-close-props')?.addEventListener('click', () => this.callbacks.onCloseProps());
    this.shadow.getElementById('tb-undo')?.addEventListener('click', () => this.callbacks.onUndo());
    this.shadow.getElementById('tb-redo')?.addEventListener('click', () => this.callbacks.onRedo());
    this.shadow.getElementById('tb-clear-all')?.addEventListener('click', () => this.callbacks.onClearMarkup());
    this.shadow.getElementById('btn-right-slider')?.addEventListener('click', () => this.callbacks.onToggleRightSlider());
    this.shadow.getElementById('btn-rs-close')?.addEventListener('click', () => this.callbacks.onToggleRightSlider());
    this.shadow.getElementById('tab-rs-mcp')?.addEventListener('click', () => this.callbacks.onSwitchRightTab('mcp'));
    this.shadow.getElementById('tab-rs-history')?.addEventListener('click', () => this.callbacks.onSwitchRightTab('history'));
    this.shadow.getElementById('btn-mcp-refresh')?.addEventListener('click', () => this.callbacks.onRefreshMcpSnapshots());
    this.shadow.getElementById('btn-copy')?.addEventListener('click', () => this.callbacks.onCopyPrompt());
    this.shadow.getElementById('btn-send')?.addEventListener('click', () => this.callbacks.onSendToAi());
    this.shadow.getElementById('btn-floating-exit')?.addEventListener('click', () => this.callbacks.onClose());
    this.shadow.getElementById('btn-scr-area')?.addEventListener('click', () => this.callbacks.onRunScrCapture('area'));
    this.shadow.getElementById('btn-scr-full')?.addEventListener('click', () => this.callbacks.onRunScrCapture('full'));
    this.shadow.getElementById('btn-scr-layer')?.addEventListener('click', () => this.callbacks.onRunScrCapture('layer'));
    this.shadow.getElementById('btn-scr-delay')?.addEventListener('click', () => this.callbacks.onRunScrCapture('delay'));
    this.shadow.getElementById('btn-scr-markup')?.addEventListener('click', () => this.callbacks.onToggleScrOption('includeMarkup'));
    this.shadow.getElementById('btn-scr-hidehud')?.addEventListener('click', () => this.callbacks.onToggleScrOption('hideHud'));
    this.shadow.getElementById('btn-scr-autocopy')?.addEventListener('click', () => this.callbacks.onToggleScrOption('autoCopy'));
    this.shadow.getElementById('btn-scr-pad')?.addEventListener('click', () => this.callbacks.onCycleScrPadding());
    this.shadow.getElementById('btn-scr-fmt')?.addEventListener('click', () => this.callbacks.onToggleScrFormat());
    this.shadow.getElementById('btn-run-ai-scan')?.addEventListener('click', () => this.callbacks.onRunAiVisionScan());

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-scr-edit]').forEach((b) =>
      b.addEventListener('click', () => b.dataset.scrEdit && this.callbacks.onEditScreenshot(b.dataset.scrEdit))
    );
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-scr-copy]').forEach((b) =>
      b.addEventListener('click', () => b.dataset.scrCopy && this.callbacks.onCopyScreenshot(b.dataset.scrCopy))
    );
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-scr-dl]').forEach((b) =>
      b.addEventListener('click', () => b.dataset.scrDl && this.callbacks.onDownloadScreenshot(b.dataset.scrDl))
    );
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-scr-send]').forEach((b) =>
      b.addEventListener('click', () => b.dataset.scrSend && this.callbacks.onSendScreenshotToAi(b.dataset.scrSend))
    );
    this.shadow.querySelectorAll<HTMLButtonElement>('[data-scr-del]').forEach((b) =>
      b.addEventListener('click', () => b.dataset.scrDel && this.callbacks.onDeleteScreenshot(b.dataset.scrDel))
    );

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-ins-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.insTab as InspectorTab;
        if (tab) this.callbacks.onSwitchInspectorTab(tab);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool as StudioTool;
        if (tool) this.callbacks.onSetTool(tool);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-shape]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const shape = btn.dataset.shape as ShapeToolId;
        if (shape) this.callbacks.onSelectShape(shape);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        if (color) this.callbacks.onSetColor(color);
      });
    });

    const customColor = this.shadow.getElementById('input-custom-color') as HTMLInputElement | null;
    customColor?.addEventListener('input', () => this.callbacks.onSetColor(customColor.value));

    const fontSelect = this.shadow.getElementById('select-font-family') as HTMLSelectElement | null;
    fontSelect?.addEventListener('change', () => this.callbacks.onSetFontFamily(fontSelect.value));

    const hexInput = this.shadow.getElementById('input-hex-color') as HTMLInputElement | null;
    hexInput?.addEventListener('input', () => {
      const val = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) this.callbacks.onSetColor(val);
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-mcp-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.mcpDel;
        if (id) this.callbacks.onDeleteMcpSnapshot(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-hist-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.histCopy;
        if (id) this.callbacks.onRecopyHistoryItem(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-hist-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.histDel;
        if (id) this.callbacks.onDeleteHistoryItem(id);
      });
    });

    this.shadow.querySelectorAll<HTMLElement>('[data-layer-id]').forEach((row) => {
      row.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-eye-id]') || target.closest('[data-del-id]') || target.closest('[data-raw-id]') || target.closest('[data-copy-id]')) return;
        const id = row.dataset.layerId;
        if (id) this.callbacks.onSelectLayer(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-copy-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.copyId;
        if (id) this.callbacks.onCopyLayer(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-raw-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.rawId;
        if (id) this.callbacks.onOpenLayerRaw(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-eye-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.eyeId;
        if (id) this.callbacks.onToggleLayerVisible(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-del-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.delId;
        if (id) this.callbacks.onDeleteLayer(id);
      });
    });

    this.shadow.querySelectorAll<HTMLButtonElement>('[data-tag]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag as LayerTag;
        if (tag && this.shadow) {
          const activeRow = this.shadow.querySelector<HTMLElement>('.layer-row.active');
          const id = activeRow?.dataset.layerId;
          if (id) this.callbacks.onUpdateLayerTag(id, tag);
        }
      });
    });

    const noteEl = this.shadow.getElementById('layer-note-input') as HTMLTextAreaElement | null;
    noteEl?.addEventListener('input', () => {
      const activeRow = this.shadow?.querySelector<HTMLElement>('.layer-row.active');
      const id = activeRow?.dataset.layerId;
      if (id) this.callbacks.onUpdateLayerNote(id, noteEl.value);
    });

    const finalInput = this.shadow.getElementById('final-instructions-input') as HTMLTextAreaElement | null;
    finalInput?.addEventListener('input', () => {
      this.callbacks.onUpdateFinalInstructions(finalInput.value);
    });
  }

  private startStatusSync() {
    const applyStatus = (connected: boolean) => {
      this.mcpConnected = connected;
      const rsTitle = this.shadow?.querySelector('.hud-right-slider .brand-title') as HTMLElement | null;
      if (rsTitle) rsTitle.innerText = `Right Slider · ${connected ? 'MCP Online' : 'MCP Offline'}`;
    };

    chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => applyStatus(res?.connected ?? false));
    this.statusListener = (msg: any) => {
      if (msg.type === 'MCP_STATUS_CHANGED') applyStatus(msg.connected ?? false);
    };
    chrome.runtime.onMessage.addListener(this.statusListener);
    this.statusInterval = setInterval(() => {
      chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (res) => applyStatus(res?.connected ?? false));
    }, 2000);
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  showToast(message: string, isError: boolean = false) {
    const existing = document.getElementById('letme-toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'letme-toast-msg';
    toast.style.cssText = `position:fixed;top:64px;left:50%;transform:translateX(-50%);background:${isError ? '#18181b' : '#050505'};border:1px solid ${isError ? '#ffffff' : '#3f3f46'};color:#fff;padding:7px 14px;border-radius:9999px;z-index:2147483647;font-family:system-ui,sans-serif;font-weight:600;font-size:11px;box-shadow:0 10px 25px rgba(0,0,0,0.75);`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.35s ease';
      setTimeout(() => toast.remove(), 350);
    }, 2200);
  }

  setHostVisible(visible: boolean) {
    if (this.host) {
      this.host.style.display = visible ? '' : 'none';
    }
  }

  remove() {
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.statusListener) chrome.runtime.onMessage.removeListener(this.statusListener);
    this.statusInterval = null;
    this.statusListener = null;
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
    }
  }
}
