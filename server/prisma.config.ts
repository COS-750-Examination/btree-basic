import { defineConfig } from 'prisma/config';

// Prisma 7 no longer reads .env on its own; load it if present (CI sets real env vars instead).
try {
  process.loadEnvFile('.env');
} catch {
  // no .env file: rely on the environment
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
