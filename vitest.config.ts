import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Force Vitest to resolve the project from the repo root instead of
  // accidentally using the examples directory.
  root: '.',
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/assets.d.ts',
        'src/component/messages/**',
        'src/component/logos/**',
      ],
    },
  },
});

