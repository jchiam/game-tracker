import { describe, it, expect, vi, beforeEach, afterAll, beforeAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import * as supabaseModule from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createTestServer } from '@/test/server';

// Create MSW server for this test file
const server = createTestServer();

// Set up MSW lifecycle
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const mockGetSession = vi.mocked(supabaseModule.supabase.auth.getSession);
const mockOnAuthStateChange = vi.mocked(supabaseModule.supabase.auth.onAuthStateChange);
const mockSignInWithOAuth = vi.mocked(supabaseModule.supabase.auth.signInWithOAuth);
const mockSignOut = vi.mocked(supabaseModule.supabase.auth.signOut);

const mockSession: Session = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    phone: '',
    confirmation_sent_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};

// Helper to create a mock subscription return value
function mockSubscription() {
  return { data: { subscription: { id: 'test-sub', callback: vi.fn(), unsubscribe: vi.fn() } } } as ReturnType<typeof supabaseModule.supabase.auth.onAuthStateChange>;
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue(mockSubscription());
    mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://oauth.example.com' }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('initialization', () => {
    it('starts with loading state and no session', () => {
      mockGetSession.mockImplementation(
        () => new Promise(() => {}), // Never resolves to simulate loading
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthLoading).toBe(true);
      expect(result.current.session).toBeNull();
    });

    it('loads session on mount', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false);
      });

      expect(result.current.session).toBe(mockSession);
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });

    it('handles null session on mount', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
    });

    it('subscribes to auth state changes on mount', async () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { id: 'test-sub', callback: vi.fn(), unsubscribe } } } as ReturnType<typeof supabaseModule.supabase.auth.onAuthStateChange>);
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      renderHook(() => useAuth());

      expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', async () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { id: 'test-sub', callback: vi.fn(), unsubscribe } } } as ReturnType<typeof supabaseModule.supabase.auth.onAuthStateChange>);
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const { unmount } = renderHook(() => useAuth());
      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth state changes', () => {
    it('updates session when auth state changes', async () => {
      let authListener: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authListener = callback;
        return mockSubscription();
      });
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthLoading).toBe(false);
      });

      // Simulate auth state change
      authListener!('SIGNED_IN', mockSession);

      await waitFor(() => {
        expect(result.current.session).toBe(mockSession);
        expect(result.current.isAuthLoading).toBe(false);
      });
    });

    it('clears session on sign out event', async () => {
      let authListener: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authListener = callback;
        return mockSubscription();
      });
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.session).toBe(mockSession);
      });

      // Simulate sign out
      authListener!('SIGNED_OUT', null);

      await waitFor(() => {
        expect(result.current.session).toBeNull();
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('calls Supabase OAuth with default redirect', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
    });

    it('calls Supabase OAuth with custom redirect path', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithGoogle('/honkai-star-rail');

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/honkai-star-rail`,
        },
      });
    });
  });

  describe('signOut', () => {
    it('calls Supabase signOut', async () => {
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { result } = renderHook(() => useAuth());

      await result.current.signOut();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
