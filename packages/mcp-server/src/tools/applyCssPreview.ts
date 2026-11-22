import { wsBridge } from '../wsBridge.js';

export async function handleApplyCssPreview(args: {
  selector: string;
  cssRules: Record<string, string>;
}) {
  const { selector, cssRules } = args;

  if (!selector || typeof selector !== 'string') {
    throw new Error('Missing or invalid "selector" parameter.');
  }

  if (!cssRules || typeof cssRules !== 'object') {
    throw new Error('Missing or invalid "cssRules" parameter (expected object of CSS properties).');
  }

  try {
    const result = await wsBridge.applyCssPreview(selector, cssRules);
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Successfully injected CSS preview into browser tab!\n- **Target Selector**: \`${selector}\`\n- **Injected Rules**:\n\`\`\`css\n${Object.entries(
            cssRules
          )
            .map(([k, v]) => `  ${k}: ${v};`)
            .join('\n')}\n\`\`\`\nUser can see this preview live on their screen right now. Use \`letme_clear_preview\` to revert.`,
        },
      ],
    };
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `❌ Failed to apply CSS preview: ${err.message}`,
        },
      ],
    };
  }
}
