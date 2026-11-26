import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { wsBridge } from './wsBridge.js';
import { handleGetActiveElement } from './tools/getActiveElement.js';
import { handleListInspections } from './tools/listInspections.js';
import { handleApplyCssPreview } from './tools/applyCssPreview.js';
import { handleClearPreview } from './tools/clearPreview.js';
import { handleGetConsoleLogs } from './tools/getConsoleLogs.js';
import { handleResolveInspection } from './tools/resolveInspection.js';

const server = new Server(
  {
    name: 'letme-mcp-server',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'letme_get_active_element',
        description:
          'Retrieves the currently inspected/annotated frontend element or bug report session from the browser by ID (or the latest if omitted), including annotated screenshot image, DOM selector, clean HTML snippet, box model metrics, wireframe layout context, layout bug diagnostics, and user styling instructions.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Optional unique report ID or snapshot ID (e.g. LTM-AI-9A2F-8E1). If omitted, returns the latest active element or bug report.',
            },
          },
        },
      },
      {
        name: 'letme_list_inspections',
        description:
          'Lists all recent elements and sections inspected by the user across browser sessions.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'letme_apply_css_preview',
        description:
          'Injects live CSS styles into the target element on the user\'s active browser page for instant visual preview.',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector of the target element in the browser.',
            },
            cssRules: {
              type: 'object',
              description:
                'Key-value map of CSS rules to preview (e.g. { "background-color": "#4f46e5", "padding": "12px", "border-radius": "8px" })',
              additionalProperties: {
                type: 'string',
              },
            },
          },
          required: ['selector', 'cssRules'],
        },
      },
      {
        name: 'letme_clear_preview',
        description:
          'Reverts any live CSS preview injected into the user\'s browser page back to original styling.',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description:
                'Optional specific CSS selector to revert. If omitted, reverts all previews.',
            },
          },
        },
      },
      {
        name: 'letme_get_console_logs',
        description:
          'Retrieves recent browser console warnings and error logs captured from the active inspected webpage.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'letme_resolve_inspection',
        description:
          'Marks an inspected element snapshot as resolved after applying the requested code or style fixes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Optional snapshot ID to resolve. If omitted, resolves the latest active element.',
            },
            resolutionNote: {
              type: 'string',
              description: 'Short summary of the files edited or fix applied.',
            },
          },
        },
      },
    ],
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'letme_get_active_element':
        return handleGetActiveElement((args as any)?.id);

      case 'letme_list_inspections':
        return handleListInspections();

      case 'letme_apply_css_preview':
        return await handleApplyCssPreview(args as any);

      case 'letme_clear_preview':
        return handleClearPreview(args as any);

      case 'letme_get_console_logs':
        return handleGetConsoleLogs();

      case 'letme_resolve_inspection':
        return handleResolveInspection(args as any);

      default:
        throw new Error(`Unknown LetMe tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message || String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  // Start WebSocket bridge first
  await wsBridge.start();

  // Connect stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[LetMe MCP Server] Connected to stdio harness transport.');
}

main().catch((err) => {
  console.error('[LetMe MCP Server] Fatal error:', err);
  process.exit(1);
});
