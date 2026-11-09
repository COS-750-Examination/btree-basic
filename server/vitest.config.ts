import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile('.env');
} catch {
  // no .env: tests that need the database are skipped
}

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Database tests share one Postgres; run files one after another.
    fileParallelism: false,
  },
});
