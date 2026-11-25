import { CustomShortcutsConfig, DEFAULT_CUSTOM_SHORTCUTS } from '@letme/shared';

export const SHORTCUTS_STORAGE_KEY = 'customShortcuts';

const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const;
const MODIFIER_SET = new Set<string>(MODIFIER_ORDER);

/**
 * Normalizes a KeyboardEvent into a canonical key token
 * (e.g. "Ctrl", "Alt", "Shift", "I", "1", "Space").
 */
export function normalizeKeyToken(e: KeyboardEvent): string | null {
  if (e.key === 'Control') return 'Ctrl';
  if (e.key === 'Alt') return 'Alt';
  if (e.key === 'Shift') return 'Shift';
  if (e.key === 'Meta') return 'Meta';
  if (e.key === 'Escape') return 'Escape';

  if (e.code?.startsWith('Key') && e.code.length === 4) {
    return e.code.slice(3).toUpperCase();
  }
  if (e.code?.startsWith('Digit') && e.code.length === 6) {
    return e.code.slice(5);
  }
  if (e.key === ' ') return 'Space';
  if (e.key.length === 1) return e.key.toUpperCase();
  return e.key;
}

/**
 * Formats a set of pressed key tokens into a canonical chord string.
 * Modifiers are ordered first (Ctrl+Alt+Shift+Meta), followed by sorted keys.
 * Valid chords require either:
 * - at least 1 modifier + at least 1 non-modifier key, OR
 * - at least 2 non-modifier keys pressed simultaneously (e.g. "I+O+U").
 */
export function formatChordFromSet(keys: Iterable<string>): string | null {
  const unique = new Set(keys);
  const modifiers: string[] = [];
  const regulars: string[] = [];

  for (const mod of MODIFIER_ORDER) {
    if (unique.has(mod)) modifiers.push(mod);
  }
  for (const k of unique) {
    if (!MODIFIER_SET.has(k) && k !== 'Escape') {
      regulars.push(k);
    }
  }

  regulars.sort();

  const hasModifierCombo = modifiers.length >= 1 && regulars.length >= 1;
  const hasMultiKeyChord = regulars.length >= 2;

  if (!hasModifierCombo && !hasMultiKeyChord) {
    return null;
  }

  return [...modifiers, ...regulars].join('+');
}

/**
 * Formats a partial preview while keys are being held down.
 */
export function formatChordPreview(keys: Iterable<string>): string {
  const unique = new Set(keys);
  const modifiers: string[] = [];
  const regulars: string[] = [];

  for (const mod of MODIFIER_ORDER) {
    if (unique.has(mod)) modifiers.push(mod);
  }
  for (const k of unique) {
    if (!MODIFIER_SET.has(k) && k !== 'Escape') {
      regulars.push(k);
    }
  }
  regulars.sort();
  return [...modifiers, ...regulars].join('+') || 'Press keys...';
}

/**
 * Normalizes a stored shortcut config with defaults.
 */
export function mergeShortcutsConfig(raw?: Partial<CustomShortcutsConfig>): CustomShortcutsConfig {
  return {
    inspect: raw?.inspect || DEFAULT_CUSTOM_SHORTCUTS.inspect,
    pickAi: raw?.pickAi || DEFAULT_CUSTOM_SHORTCUTS.pickAi,
    screenshot: raw?.screenshot || DEFAULT_CUSTOM_SHORTCUTS.screenshot,
    screenshotMode: raw?.screenshotMode === 'full' ? 'full' : 'area',
  };
}
