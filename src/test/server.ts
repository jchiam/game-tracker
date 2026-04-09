import { setupServer } from 'msw/node';
import { createSupabaseAuthHandlers, type SupabaseMockOptions } from './mocks/handlers';

/**
 * Creates an MSW server instance for Vitest unit tests.
 * Each test file should create its own server to avoid runner conflicts.
 *
 * Usage in test files:
 * ```ts
 * import { createTestServer } from '@/test/server';
 *
 * const server = createTestServer();
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */
export function createTestServer(options?: SupabaseMockOptions) {
  const handlers = createSupabaseAuthHandlers(options);
  return setupServer(...handlers);
}
