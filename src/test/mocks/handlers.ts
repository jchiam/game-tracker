import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for Supabase Auth API endpoints.
 * These intercept network requests at the HTTP layer,
 * providing realistic integration testing without real network calls.
 */

export interface SupabaseMockOptions {
  initialSession?: {
    access_token: string;
    refresh_token: string;
    user: {
      id: string;
      email?: string;
      [key: string]: unknown;
    };
  } | null;
}

/**
 * Create Supabase auth handlers with configurable initial state.
 */
export function createSupabaseAuthHandlers(options: SupabaseMockOptions = {}) {
  const { initialSession = null } = options;
  let currentSession = initialSession;

  return [
    // GET /auth/v1/user - Get user from token
    http.get('*/auth/v1/user', async () => {
      if (!currentSession) {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return HttpResponse.json(currentSession.user, { status: 200 });
    }),

    // POST /auth/v1/token - Token refresh
    http.post('*/auth/v1/token', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      if (body.grant_type === 'refresh_token') {
        if (!currentSession) {
          return HttpResponse.json({ error: 'Invalid refresh token' }, { status: 400 });
        }
        return HttpResponse.json(currentSession, { status: 200 });
      }
      return HttpResponse.json({ error: 'Unsupported grant type' }, { status: 400 });
    }),

    // POST /auth/v1/logout - Sign out
    http.post('*/auth/v1/logout', async () => {
      currentSession = null;
      return new HttpResponse(null, { status: 204 });
    }),

    // GET /auth/v1/authorize - OAuth flow (redirects)
    http.get('*/auth/v1/authorize', async () => {
      return HttpResponse.redirect('https://oauth.example.com/callback', 302);
    }),
  ];
}

/**
 * Default handlers with null session (unauthenticated state).
 */
export const supabaseHandlers = createSupabaseAuthHandlers();
