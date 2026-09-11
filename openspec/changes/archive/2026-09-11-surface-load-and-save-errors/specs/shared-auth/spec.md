## MODIFIED Requirements

### Requirement: Auth loading state

The system SHALL expose an auth-loading flag that is true until the initial session check settles, preventing premature auth-gated renders. A rejected session check SHALL settle as signed-out and tell the user, never leave the app loading indefinitely.

#### Scenario: Initial load

- **WHEN** app mounts
- **THEN** `isAuthLoading` is true until `supabase.auth.getSession()` settles

#### Scenario: Session resolved

- **WHEN** session check completes (with or without a session)
- **THEN** `isAuthLoading` becomes false

#### Scenario: Session check rejects

- **WHEN** `supabase.auth.getSession()` rejects
- **THEN** `session` is null, `isAuthLoading` becomes false, and an error toast ("Couldn't check your sign-in. Please reload.") is shown
