## Purpose

Authentication for the game tracker. Google OAuth via Supabase. Covers sign-in, sign-out, session lifecycle, and auth-gating of protected content.

## Requirements

### Requirement: Sign in with Google

The system SHALL authenticate users via Google OAuth through Supabase. Sign-in redirects back to the originating path when a redirect target is provided.

#### Scenario: Sign in from root

- **WHEN** user clicks "Sign In with Google" with no redirect target
- **THEN** system initiates Google OAuth and redirects back to the app origin on completion

#### Scenario: Sign in with redirect target

- **WHEN** user clicks "Sign In with Google" and a redirect path is supplied
- **THEN** system initiates Google OAuth and redirects to `{origin}{redirectPath}` on completion

### Requirement: Sign out

The system SHALL allow an authenticated user to end their session.

#### Scenario: Sign out

- **WHEN** authenticated user triggers sign-out
- **THEN** Supabase session is cleared and session state becomes null

### Requirement: Session persistence across tabs

The system SHALL detect and reflect session changes across browser tabs without requiring a page reload.

#### Scenario: Session change in another tab

- **WHEN** user signs in or out in a different browser tab
- **THEN** current tab updates session state to match within the same browser session

### Requirement: Auth loading state

The system SHALL expose an auth-loading flag that is true until the initial session check resolves, preventing premature auth-gated renders.

#### Scenario: Initial load

- **WHEN** app mounts
- **THEN** `isAuthLoading` is true until `supabase.auth.getSession()` resolves

#### Scenario: Session resolved

- **WHEN** session check completes (with or without a session)
- **THEN** `isAuthLoading` becomes false

### Requirement: Auth gate for unauthenticated users

The system SHALL render an auth gate prompt in place of protected content when no session is present and auth loading is complete.

#### Scenario: Unauthenticated access to protected content

- **WHEN** user is not authenticated and `isAuthLoading` is false
- **THEN** `AuthGate` component is rendered with a "Sign In with Google" button

#### Scenario: Authenticated access

- **WHEN** user has an active session
- **THEN** protected content is rendered instead of the auth gate
