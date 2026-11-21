import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Build configuration for the stand-alone demo/preview bundle.
 * Produces a single classic (non-module) script + one CSS file so the demo also
 * runs when the html file is opened straight from disk (file://).
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
