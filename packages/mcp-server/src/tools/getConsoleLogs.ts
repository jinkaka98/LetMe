import { globalStore } from '../stateStore.js';

export function handleGetConsoleLogs() {
  const logs = globalStore.getConsoleLogs();

  if (logs.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No runtime errors or console logs captured from the browser page.',
        },
      ],
    };
  }

  const lines: string[] = ['# Browser Console Logs\n'];
  logs.forEach((log) => {
    const icon = log.type === 'error' ? '🔴' : log.type === 'warn' ? '🟡' : 'ℹ️';
    lines.push(`- ${icon} **[${log.type.toUpperCase()}]** (${new Date(log.timestamp).toLocaleTimeString()}): ${log.message}`);
    if (log.stack) {
      lines.push(`  \`\`\`\n  ${log.stack.trim()}\n  \`\`\``);
    }
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: lines.join('\n'),
      },
    ],
  };
}
