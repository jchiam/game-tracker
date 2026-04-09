import { vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Create a mock Supabase User fixture.
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    phone: '',
    confirmation_sent_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

/**
 * Create a mock Supabase Session fixture.
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  const user = createMockUser(overrides.user as Partial<User> | undefined);
  return {
    user,
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  } as Session;
}

/**
 * Create a mock Supabase auth client with configurable behavior.
 */
export function createMockAuthClient(
  options: {
    initialSession?: Session | null;
    onSignOut?: () => void;
  } = {},
) {
  const { initialSession = null, onSignOut } = options;
  let currentSession = initialSession;
  const authStateListeners: Array<(event: string, session: Session | null) => void> = [];

  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: currentSession }, error: null }),
    onAuthStateChange: vi.fn().mockImplementation((_event, callback) => {
      authStateListeners.push(callback);
      return {
        unsubscribe: vi.fn(),
      };
    }),
    signInWithOAuth: vi
      .fn()
      .mockResolvedValue({ data: { url: 'https://oauth.example.com' }, error: null }),
    signOut: vi.fn().mockImplementation(async () => {
      currentSession = null;
      onSignOut?.();
      return { error: null };
    }),
    _setSession: (session: Session | null) => {
      currentSession = session;
      // Notify all listeners
      authStateListeners.forEach((cb) => cb('SIGNED_IN', session));
    },
    _getListeners: () => authStateListeners,
  };
}

/**
 * Create a full mock Supabase client with all methods mocked.
 */
export function createMockSupabaseClient(
  options: {
    initialSession?: Session | null;
  } = {},
) {
  const auth = createMockAuthClient({ initialSession: options.initialSession });

  return {
    auth,
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
}

/**
 * Factory to mock the entire @/lib/supabase module.
 * Use with vi.mock() for consistent Supabase mocking across tests.
 *
 * Example:
 * ```ts
 * vi.mock('@/lib/supabase', () => createSupabaseMockFactory({ initialSession: mockSession }));
 * ```
 */
export function createSupabaseMockFactory(
  options: {
    initialSession?: Session | null;
  } = {},
) {
  const client = createMockSupabaseClient(options);
  return {
    supabase: client,
  };
}
