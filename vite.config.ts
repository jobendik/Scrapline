import { defineConfig } from 'vite';

// GitHub Pages serves the site under /<repo-name>/, so we need a matching base.
// Use the repo name from the GitHub workflow when building for Pages, or "/" locally.
const repoBase = process.env.GITHUB_PAGES_BASE ?? '/Scrapline/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoBase : '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Keep a single small JS bundle for fastest first paint on CrazyGames embeds.
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
}));
