import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        content: resolve(__dirname, 'src/content/contentScript.ts'),
        background: resolve(__dirname, 'src/background/serviceWorker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') return 'contentScript.js';
          if (chunkInfo.name === 'background') return 'background.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) return '[name][extname]';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  plugins: [
    {
      name: 'copy-extension-manifest',
      closeBundle() {
        try {
          const manifestPath = resolve(__dirname, 'manifest.json');
          const distPath = resolve(__dirname, 'dist');
          if (!fs.existsSync(distPath)) {
            fs.mkdirSync(distPath, { recursive: true });
          }

          const rawManifest = fs.readFileSync(manifestPath, 'utf-8');
          const manifest = JSON.parse(rawManifest);

          manifest.background = {
            service_worker: 'background.js',
            type: 'module',
          };
          manifest.content_scripts = [
            {
              matches: ['<all_urls>'],
              js: ['contentScript.js'],
              run_at: 'document_idle',
            },
          ];
          if (fs.existsSync(resolve(distPath, 'src/popup/popup.html'))) {
            let popupHtml = fs.readFileSync(resolve(distPath, 'src/popup/popup.html'), 'utf-8');
            popupHtml = popupHtml.replace(/\.\.\/\.\.\//g, './').replace(/\s*crossorigin(="[^"]*")?/g, '');
            fs.writeFileSync(resolve(distPath, 'popup.html'), popupHtml);
          }

          manifest.action = {
            ...manifest.action,
            default_popup: 'popup.html',
            default_title: 'LetMe UI Inspector',
          };

          fs.writeFileSync(resolve(distPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
          console.log('[Vite Plugin] Successfully generated dist/manifest.json for Chrome MV3.');
        } catch (err) {
          console.error('[Vite Plugin] Failed to copy manifest.json:', err);
        }
      },
    },
  ],
});
