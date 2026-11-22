#!/usr/bin/env node

import('../dist/index.js').catch((err) => {
  console.error('[letme-mcp] Error starting server:', err);
  process.exit(1);
});
