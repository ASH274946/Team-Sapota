import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    env: {
      REDIS_URL: 'redis://localhost:6379',
      REDIS_BULLMQ_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-that-is-at-least-16-chars',
      FRONTEND_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
