import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
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
