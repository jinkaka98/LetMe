import { wsBridge } from '../wsBridge.js';

export function handleClearPreview(args?: { selector?: string }) {
  wsBridge.clearCssPreview(args?.selector);
  return {
    content: [
      {
        type: 'text' as const,
        text: `🧹 CSS preview has been cleared in the browser.${args?.selector ? ` (Selector: \`${args.selector}\`)` : ' (All injected styles reverted)'}`,
      },
    ],
  };
}
