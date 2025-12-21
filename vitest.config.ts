import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Force Vitest to resolve the project from the repo root instead of
  // accidentally using the examples directory.
  root: '.',
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});

