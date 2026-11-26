import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/content/mainWorldBridge.ts'),
      name: 'LetMeMainWorldBridge',
      formats: ['iife'],
      fileName: () => 'mainWorldBridge.js',
    },
  },
});
