import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Unit tests only — the conflict registry and other plain-TS lib logic.
// No jsdom: nothing here touches the DOM, and keeping it node-only makes the
// suite fast enough to run on every change.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
