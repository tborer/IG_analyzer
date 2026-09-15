import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Default environment for *.test.ts (lib/API tests). Component tests
    // (*.test.tsx) opt into jsdom individually via a
    // `// @vitest-environment jsdom` docblock at the top of the file --
    // Vitest 4 dropped environmentMatchGlobs, so per-file globs aren't an
    // option here.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // §3.5: report only, no enforced threshold yet -- real coverage
      // gaps exist today and a hard gate would just block unrelated PRs.
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname),
    },
  },
});
