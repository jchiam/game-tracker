import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    setupFiles: ['src/test/setup.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/test-utils/**',
        '**/*.config.{ts,js}',
        '**/vite-env.d.ts',
      ],
      thresholds: {
        lines: 82,
        statements: 83,
        functions: 80,
        branches: 74,
      },
    },
  },
});
