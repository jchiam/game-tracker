# Surface Load and Save Errors

## Why

A failed DB request (HTTP 500, timeout, RLS rejection) currently looks like "nothing here" almost everywhere in the tracker: the roster's load-error branch renders inside the same dashed grey `.empty-state` box as an empty roster, the parties tab has no error branch at all (a failed load falls through to "No parties configured yet. Build your first team!"), party save/delete/favorite failures produce no user-visible signal, a rejected auth check leaves the app on "Checking sign-in…" forever, and a failed lazy route chunk (stale deploy hash) unmounts the tree to a blank page. Errors must read as errors — distinct from empty, distinct from loading — and every failed mutation must tell the user it failed.

## What Changes

- New shared L3 `ErrorState` component (twin of `LoadingState`): warning glyph, message, optional Retry action, `role="alert"`. New L2 `.error-state` rule in `controls.css` using the existing `color.ui.danger` tokens — solid danger border and tinted fill, visually distinct from dashed `.empty-state` and borderless `.loading-state`. `LoadErrorState` is removed in favour of it.
- Error copy becomes cause-neutral: "Couldn't load your roster." / "Couldn't load your {parties}." with a Retry button, replacing "Failed to load data. Please check your connection and try again." (a 500 is not a connection problem).
- Shared party hook gains load-error parity with the roster hook: `isInitialLoad`, `isLoadError`, `retryLoad`. `PartiesView` gains an error rung between loading and empty. Pages wire the party hook's own loading flag (today they pass the roster's, so the parties tab can show a false empty while parties are still loading).
- Roster Retry reloads both roster and parties; the parties-tab Retry reloads parties only.
- Party mutation failures surface: save failure shows an error toast and keeps the editor open; a party saved without its members shows a warning toast; delete and favorite-toggle failures show an error toast; a failed post-save reload or manual refresh shows an error toast.
- **BREAKING (internal contract)**: `saveParty` resolves to a `PartySaveResult` `{ partyId, membersSaved }` instead of `string | null`, so "saved without members" is a first-class outcome rather than an inference.
- Roster field saves roll back on write failure: a rejected debounced update restores the affected fields to their pre-edit values alongside the existing error toast (closes the gap between `shared-save-behaviour`'s existing rollback requirement and the implementation, which today only rolls back add/remove).
- `savePreferenceRows` throws on delete and parent-update errors, not only on insert errors.
- `useAuth` handles a rejected initial session check: resolves as signed-out, clears the loading flag, shows an error toast.
- New route-level error boundary around the lazy route `Suspense` renders `ErrorState` with a Reload action instead of a blank page.
- Tests: MSW REST handlers that return HTTP 500 for a table, an MSW-backed persistence test proving a 500 surfaces as a thrown error through the real client, hook/view tests for every new branch, and a Storybook story for `ErrorState`.

## Capabilities

### New Capabilities

- `shared-error-state`: The `ErrorState` component contract (glyph + message + retry, alert semantics, `.error-state` styling distinct from empty and loading), the cause-neutral error copy, and its adoption across the error surfaces: roster render ladder, parties tab, party editor save failure, and the route-level error boundary.

### Modified Capabilities

- `shared-roster`: Retry on load failure — the roster Retry also retries the parties load.
- `shared-parties`: Load parties gains a DB-failure scenario and a retry requirement; save, delete, favorite toggle, and manual refresh gain failure-feedback scenarios; save resolves to a result object.
- `shared-roster-persistence`: Unified party error semantics — `saveParty` resolves to `{ partyId, membersSaved }`; shared preference-rows save — delete and parent-update errors are rethrown.
- `shared-save-behaviour`: Rollback on write failure — field-update rollback is scoped to the patch-based field updaters and restores only the fields in the failed payload.
- `shared-auth`: Auth loading state — a rejected initial session check resolves as signed-out with an error toast instead of loading forever.
- `shared-loading-state`: Parties tab shows loading before empty — the adapter forwards the party hook's own loading flag, not the roster's.

## Impact

- **New files**: `src/components/ErrorState.tsx` (+ `.test.tsx`, `.stories.tsx`), `src/components/RouteErrorBoundary.tsx` (+ `.test.tsx`), `src/hooks/useParties.test.ts`, `src/services/rosterPersistence.msw.test.ts`, MSW REST handlers in `src/test/mocks/handlers.ts`.
- **Removed**: `src/components/LoadErrorState.tsx` and its test/story; `.retry-button` rule in `RosterPageLayout.css`.
- **Modified**: `src/styles/controls.css` (`.error-state`), `src/components/RosterPageLayout.tsx` (+ stories), `src/components/parties/PartiesView.tsx` (+ tests, stories), `src/hooks/useParties.ts`, six per-game `useParties.ts` wrappers, six `PartiesTab.tsx` adapters, six game pages and their tests, `src/hooks/useRoster.ts` (+ test), `src/services/rosterPersistence.ts` (+ test), `src/hooks/useAuth.ts` (+ test), `src/App.tsx`, `src/types.ts` (`PartySaveResult`).
- **Docs**: `CLAUDE.md` L3 table and Shared Components list (`LoadErrorState` → `ErrorState`, new `RouteErrorBoundary`), `CONTEXT.md` Party Persistence Factory error semantics, `src/styles/components.md`.
- **No DB or migration changes. No new tokens** — reuses `color.ui.danger` / `color.ui.dangerBg` and existing spacing/radius tokens.
