import { globalStore } from '../stateStore.js';

export function handleResolveInspection(args?: { id?: string; resolutionNote?: string }) {
  const updated = globalStore.resolveSnapshot(args?.id, args?.resolutionNote);

  if (!updated) {
    return {
      content: [
        {
          type: 'text' as const,
          text: args?.id
            ? `Inspection with ID "${args.id}" was not found.`
            : 'No active inspection found to resolve.',
        },
      ],
    };
  }

  const noteLine = updated.resolutionNote ? `\n- **Resolution Note**: ${updated.resolutionNote}` : '';
  return {
    content: [
      {
        type: 'text' as const,
        text: `Marked inspection \`${updated.id}\` (<${updated.tagName.toLowerCase()}> \`${updated.selector}\`) as **resolved**.${noteLine}`,
      },
    ],
  };
}
