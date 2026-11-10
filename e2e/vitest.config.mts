import { defineConfig } from 'vitest/config';

// Installing a variant project takes up to a minute. Code generation and Vite builds take a few seconds each.
const INSTALL_TIMEOUT_MS = 300_000;
const STEP_TIMEOUT_MS = 120_000;

export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ['e2e.test.ts'],
    globalSetup: ['global-setup.ts'],
    hookTimeout: INSTALL_TIMEOUT_MS,
    testTimeout: STEP_TIMEOUT_MS,
  },
});
