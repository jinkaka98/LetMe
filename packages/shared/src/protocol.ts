import { ElementSnapshot, LivePreviewRequest, ConsoleLogEntry, LivePreviewResult } from './types.js';

export const DEFAULT_WS_PORT = 8765;

export type ClientMessageType =
  | 'REGISTER_TAB'
  | 'ELEMENT_CAPTURED'
  | 'LIVE_PREVIEW_APPLIED'
  | 'CONSOLE_LOGS'
  | 'PING';

export type ServerMessageType =
  | 'PONG'
  | 'APPLY_CSS_PREVIEW'
  | 'CLEAR_CSS_PREVIEW'
  | 'HIGHLIGHT_ELEMENT'
  | 'REQUEST_ACTIVE_ELEMENT';

export interface BaseMessage<T extends string, P = any> {
  type: T;
  payload: P;
  timestamp: number;
}

export interface RegisterTabPayload {
  tabId?: number;
  url: string;
  title: string;
}

export type ClientMessage =
  | BaseMessage<'REGISTER_TAB', RegisterTabPayload>
  | BaseMessage<'ELEMENT_CAPTURED', ElementSnapshot>
  | BaseMessage<'LIVE_PREVIEW_APPLIED', LivePreviewResult>
  | BaseMessage<'CONSOLE_LOGS', { url: string; logs: ConsoleLogEntry[] }>
  | BaseMessage<'PING', { timestamp: number }>;

export type ServerMessage =
  | BaseMessage<'PONG', { timestamp: number }>
  | BaseMessage<'APPLY_CSS_PREVIEW', LivePreviewRequest>
  | BaseMessage<'CLEAR_CSS_PREVIEW', { selector?: string }>
  | BaseMessage<'HIGHLIGHT_ELEMENT', { selector: string; durationMs?: number }>
  | BaseMessage<'REQUEST_ACTIVE_ELEMENT', Record<string, never>>;
