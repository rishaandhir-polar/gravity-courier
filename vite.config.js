import { defineConfig } from 'vite';

/**
 * Vite Configuration for Gravity Courier
 * base: './' ensures that assets are relative-linked, 
 * which is required for sub-directory hosting on GitHub Pages.
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
