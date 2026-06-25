// ============================================================================
//  vitest.config.js — frontend unit + hook tests
// ----------------------------------------------------------------------------
//  Mirrors the path alias from vite.config.js so `@/...` imports resolve in
//  tests the same way they do in the dev server. jsdom is required for any
//  hook that touches `window`, `document`, or React's effect lifecycle.
// ============================================================================

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    css: false,
    // Per-test cleanup is handled by @testing-library/react's auto cleanup
    // (registered in setup.js). Keep individual specs isolated.
    clearMocks: true,
    restoreMocks: true,
  },
});
