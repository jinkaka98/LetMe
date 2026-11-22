import { globalStore } from '../stateStore.js';

export function handleListInspections() {
  const snapshots = globalStore.getSnapshots();

  if (snapshots.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No inspections captured yet. Use the LetMe Chrome extension to inspect elements on any webpage.',
        },
      ],
    };
  }

  const lines: string[] = ['# Inspected Elements History\n'];
  snapshots.forEach((snap, idx) => {
    lines.push(
      `### ${idx + 1}. <${snap.tagName.toLowerCase()}> \`${snap.selector}\``
    );
    lines.push(`- **ID**: ${snap.id}`);
    lines.push(`- **Page**: ${snap.pageTitle} (${snap.url})`);
    lines.push(`- **Size**: ${snap.boxModel.width}px × ${snap.boxModel.height}px`);
    if (snap.userInstructions) {
      lines.push(`- **Instruction**: ${snap.userInstructions}`);
    }
    if (snap.userBugNotes) {
      lines.push(`- **Reported Bug**: ${snap.userBugNotes}`);
    }
    lines.push('');
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
