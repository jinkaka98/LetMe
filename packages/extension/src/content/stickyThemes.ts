import { StickyNoteThemeId } from 'letme-shared';

export interface StickyThemeSpec {
  id: StickyNoteThemeId;
  label: string;
  bg: string;
  headerBg: string;
  border: string;
  text: string;
  muted: string;
}

export const STICKY_THEME_ORDER: StickyNoteThemeId[] = ['amber', 'rose', 'sky', 'mint', 'dark'];

export const STICKY_THEMES: Record<StickyNoteThemeId, StickyThemeSpec> = {
  amber: {
    id: 'amber',
    label: 'Amber',
    bg: '#fef08a',
    headerBg: '#fde047',
    border: '#ca8a04',
    text: '#422006',
    muted: '#713f12',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    bg: '#fecdd3',
    headerBg: '#fda4af',
    border: '#e11d48',
    text: '#4c0519',
    muted: '#881337',
  },
  sky: {
    id: 'sky',
    label: 'Sky',
    bg: '#bae6fd',
    headerBg: '#7dd3fc',
    border: '#0284c7',
    text: '#082f49',
    muted: '#0c4a6e',
  },
  mint: {
    id: 'mint',
    label: 'Mint',
    bg: '#bbf7d0',
    headerBg: '#86efac',
    border: '#16a34a',
    text: '#052e16',
    muted: '#14532d',
  },
  dark: {
    id: 'dark',
    label: 'Blueprint',
    bg: '#18181b',
    headerBg: '#27272a',
    border: '#52525b',
    text: '#fafafa',
    muted: '#a1a1aa',
  },
};

export function getStickyTheme(id?: StickyNoteThemeId): StickyThemeSpec {
  return STICKY_THEMES[id || 'amber'] || STICKY_THEMES.amber;
}

export function getNextStickyTheme(current?: StickyNoteThemeId): StickyNoteThemeId {
  const idx = STICKY_THEME_ORDER.indexOf(current || 'amber');
  return STICKY_THEME_ORDER[(idx + 1) % STICKY_THEME_ORDER.length];
}

export function drawStickyNoteOnCanvas(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    theme?: StickyNoteThemeId;
    scale?: number;
  },
) {
  const theme = getStickyTheme(opts.theme);
  const scale = opts.scale ?? 1;
  const r = 8 * scale;
  const headerH = 22 * scale;
  const pad = 10 * scale;
  const { x, y, width, height } = opts;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetY = 4 * scale;

  // Card body
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
  ctx.fillStyle = theme.bg;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.strokeStyle = theme.border;
  ctx.stroke();

  // Header strip
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, headerH, [r, r, 0, 0]);
  ctx.fillStyle = theme.headerBg;
  ctx.fill();
  ctx.restore();

  // Subtle divider
  ctx.beginPath();
  ctx.moveTo(x, y + headerH);
  ctx.lineTo(x + width, y + headerH);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = Math.max(0.75, 1 * scale);
  ctx.stroke();

  // Text lines
  const fontSize = Math.max(11, Math.round(12 * scale));
  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = theme.text;
  ctx.textBaseline = 'top';

  const maxW = Math.max(20, width - pad * 2);
  const lineH = fontSize * 1.4;
  const paragraphs = (opts.text || '').split('\n');
  let curY = y + headerH + pad * 0.8;

  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        if (curY + lineH <= y + height - pad * 0.5) {
          ctx.fillText(line, x + pad, curY);
          curY += lineH;
        }
        line = word;
      } else {
        line = test;
      }
    }
    if (line && curY + lineH <= y + height - pad * 0.5) {
      ctx.fillText(line, x + pad, curY);
      curY += lineH;
    }
  }
  ctx.restore();
}
