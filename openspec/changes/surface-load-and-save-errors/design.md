# Design — Surface Load and Save Errors

## Context

See `proposal.md` — Why. The relevant current state:

- The stateful page-level boxes are `.loading-state` (borderless, `controls.css`, added by `add-shared-loading-state`), `.empty-state` (dashed grey, `RosterPageLayout.css`), and `.empty-state.auth-gate`. There is no error box; `LoadErrorState` borrows `.empty-state`. The design tokens already carry `color.ui.danger` / `color.ui.dangerBg` and `color.toast.error*`, consumed only by toasts and delete buttons.
- `useRoster` owns `isInitialLoad` / `isLoadError` / `retryLoad`; `RosterPageLayout` has the only render ladder with an error rung. `useParties` owns `isLoading` (which no page reads) and swallows load errors; `PartiesView` has a loading → empty → cards ladder. Every page passes the **roster's** `isInitialLoad` into `PartiesTab`.
- The Party Persistence Factory's error contract is asymmetric by design (`CONTEXT.md`): `loadParties` throws, `saveParty` resolves `null`, `deleteParty` / `toggleFavoriteParty` return `false`. The return values are signals with no receiver — `useParties` and `PartiesView` never act on them.
- `usePendingSaves` owns the error toast for debounced writes, but `applyPatch` keeps no snapshot, so a failed field save leaves the card showing the unsaved value until reload. `shared-save-behaviour` already requires rollback on field-update failure; the implementation only rolls back add/remove.
- `savePreferenceRows` ignores errors from its delete and parent-update steps.
- `App.tsx` has a `Suspense` fallback but no error boundary. `useAuth` never handles a `getSession()` rejection.
- MSW handlers cover only `/auth/v1/*`. Service tests mock the Supabase client via `createBuilder`.

## Goals / Non-Goals

**Goals:**

- One shared error primitive (`ErrorState` + `.error-state`) that every page-level failure uses, visually distinct from empty and loading, announced as an alert.
- Load-state parity between the roster hook and the party hook so both ladders have the same rungs.
- Every failed mutation reaches the user through the existing toast system; no return value is dropped on the floor.
- Optimistic field edits roll back on write failure, per the existing `shared-save-behaviour` requirement.
- Errors above the data layer (auth check, route chunk) settle into a visible state instead of an infinite loader or a blank page.
- Test coverage that proves an HTTP 500 reaches the UI as an error, not as empty content.

**Non-Goals:**

- Retry/backoff of failed writes, offline queueing, or an error-reporting service.
- Rollback for `queueAction`-based writes (relics, preference chains, N2E awakening). Those are per-game custom bodies with game-specific snapshots; they keep toast-only feedback.
- Fixing the non-atomic delete-then-reinsert pattern (still deferred to the RPC fix documented in CLAUDE.md).
- Distinguishing error causes in copy (500 vs timeout vs RLS). The client cannot know reliably; copy stays cause-neutral.
- Changing `.empty-state` or `.loading-state` styling.

## Decisions

### D1. `ErrorState` is an L3 component with an L2 `.error-state` rule in `controls.css`

Twin of `LoadingState`: `message`, optional `onRetry`, optional `retryLabel` (default "Retry"). Container `role="alert"`; glyph `⚠` in an `aria-hidden` span; retry button `className="btn primary-action"`.

Styling: `grid-column: 1 / -1`, centered column, `border: 1px solid color-mix(in srgb, var(--color-ui-danger) 60%, transparent)`, `background: var(--color-ui-danger-bg)`, text `--color-text-primary`, radius `--border-radius-lg`, padding matching `.empty-state`. The 60% border matches the badge convention already documented for danger-hued borders.

_Why `controls.css` and not `RosterPageLayout.css`:_ `RosterPageLayout.css` is imported by a route-split component, so its rules only exist on game pages. The route error boundary lives above the routes and needs the rule globally — same reason `.loading-state` went to `controls.css`.

_Why replace `LoadErrorState` rather than wrap it:_ it has one call site, a fixed message, and no semantics of its own. Keeping it would mean two names for one thing. Its test and story move to `ErrorState`.

_Why `btn primary-action` for Retry:_ the styled-button convention is opt-in via `.btn`; the parties create button already uses `btn primary-action`. The bespoke `.retry-button` rule in `RosterPageLayout.css` is deleted.

_Alternative considered:_ a `variant="error"` prop on `LoadingState` or on a generic `StatusBox`. Rejected — loading and error have different ARIA roles, different children (spinner vs. button), and different CSS; a shared box would be a prop-switch over two unrelated things.

### D2. `useParties` mirrors `useRoster`'s load-state shape

Rename `isLoading` → `isInitialLoad`; add `isLoadError` and `retryLoad` (clear error, set loading, bump a retry counter that the load effect depends on). The load effect's catch sets `isLoadError`. The six per-game `useParties.ts` wrappers pass the three through unchanged.

_Why rename:_ the roster hook, the layout, and `PartiesView` all already say `isInitialLoad`. One name for one concept across both hooks removes the mapping the pages would otherwise carry.

### D3. Page-level retry composition

Each page builds `retryAll = () => { retryLoad(); retryParties(); }` and passes it as `RosterPageLayout.onRetry`; it passes the party hook's `retryLoad` alone as `PartiesTab.onRetry`. Roster Retry recovers both (one action after a shared outage); the parties tab's Retry touches only parties (the roster is healthy on that tab or the user would be looking at the roster error).

_Alternative considered:_ a single shared "reload everything" callback for both surfaces. Rejected — retrying a healthy roster from the parties tab flashes the roster loader for nothing.

### D4. `saveParty` resolves to a result object

```ts
export interface PartySaveResult {
  partyId: string | null; // null → party row insert/update failed
  membersSaved: boolean; // false → row persisted, member insert failed
}
```

Lives in `src/types.ts` beside the party types. The factory sets `membersSaved: true` when there are no members to write. `useParties.saveParty` and `PartiesView.onSaveParty` adopt the same type.

_Why a result object over inferring from the reload:_ a single bulk member insert is all-or-nothing, so the hook _could_ infer "saved without members" by reloading and finding zero members. That couples the toast to reload semantics and silently breaks if the reload itself fails. An explicit outcome is a documented contract, matches the asymmetry note in `CONTEXT.md`, and costs only a type ripple (factory, hook, view, per-game wrappers re-export the type).

_Why not throw:_ the existing rule stands — nothing in the save chain catches, and `handleSave` in the editor does not await `onSave`. Resolving is safer than rejecting.

### D5. `useParties` owns mutation feedback

The hook, not the view, calls `addToast` — the same placement as `useRoster` (add/remove toasts) and `usePendingSaves` (field-save toast). Nouns come from a new `nouns: { party: string }` field on `PartyConfig` (each per-game wrapper passes its noun, e.g. "party" / "lineup" / "squad").

| Outcome                              | Feedback                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `saveParty` → `partyId: null`        | error toast "Couldn't save {party}. Please try again."; no reload; result returned                                 |
| `saveParty` → `membersSaved: false`  | reload; warning toast "{Party} saved, but its members couldn't be saved. Please edit and try again."               |
| post-save reload rejects             | error toast "Saved, but couldn't refresh your {parties}."; `isLoadError = true`; result still returned with the id |
| `deleteParty` → `false`              | error toast "Couldn't delete {party}. Please try again."; local state untouched                                    |
| favorite persist → `false` / rejects | revert (existing) + error toast "Couldn't update favorite. Please try again."                                      |
| `refreshParties` rejects             | error toast; `isLoadError = true`; existing parties kept                                                           |

Delete stays "remove after confirm" rather than optimistic-then-restore: the current implementation removes only on `success`, which is already correct, so only the toast is added.

`PartiesView.onSave` closes the modal only when `result.partyId` is non-null. The editor's local state (name, tier, notes, members) is untouched on failure.

### D6. Field-save rollback in `useRoster.applyPatch`

A `snapshots` ref keyed by `dbId` captures the row **before its first pending patch** (set only when no snapshot exists for that key). `applyPatch` wraps the flush:

```
queueUpdate(dbId, patch, async (merged) => {
  const before = snapshots.current[dbId]; delete snapshots.current[dbId];
  try { await updateEntity(dbId, merged); }
  catch (e) {
    setTrackedEntities(prev => prev.map(t => t.id === id ? { ...t, ...pick(before, Object.keys(merged)) } : t));
    throw e;   // usePendingSaves still shows its toast
  }
});
```

Only the keys in the failed merged payload revert, so a later patch to a different field (already merged into the same payload or queued after) keeps its value. The snapshot is released at flush start, so edits made while the write is in flight start a fresh snapshot.

_Trade-off:_ an edit made while a write is in flight snapshots the in-flight (possibly doomed) value; if both writes fail, the second rollback restores the first attempt's value rather than the original. This is a one-second window on a double failure; accepted and noted in the spec's scope sentence.

_Alternative considered:_ rolling back in `usePendingSaves` generically. Rejected — the queue is entity-agnostic and holds only payloads, not row state.

### D7. `savePreferenceRows` checks every step

Each delete and the parent update destructure `{ error }` and log + throw with the existing "Preference Rows Save Failed:" prefix. Behaviour on the happy path is unchanged. Throwing before the inserts is strictly better than the current path: a failed delete followed by a successful insert produces duplicate rows.

### D8. `RouteErrorBoundary` class component

React error boundaries must be class components; this is the only class in `src/`, justified in a comment. Props: `children`. On catch: `console.error` and render `<ErrorState message="Something went wrong loading this page." retryLabel="Reload" onRetry={() => window.location.reload()} />`. Placed inside the `.layout` div, around `Suspense`, so `Navbar` and `ToastContainer` stay mounted. Reload (not reset) is the right recovery for the dominant cause — a stale chunk hash after a deploy — because a re-render would refetch the same missing chunk.

### D9. `useAuth` settles on rejection

`getSession().then(...).catch(() => { setSession(null); setIsAuthLoading(false); addToast('Couldn't check your sign-in. Please reload.', 'error'); })`. `onAuthStateChange` remains subscribed so a later successful refresh still signs the user in.

### D10. Copy

| Surface        | Copy                                                |
| -------------- | --------------------------------------------------- |
| Roster ladder  | "Couldn't load your roster." + Retry                |
| Parties tab    | "Couldn't load your {partiesLower}." + Retry        |
| Route boundary | "Something went wrong loading this page." + Reload  |
| Auth check     | toast "Couldn't check your sign-in. Please reload." |

"Please check your connection" is dropped everywhere: the client sees the same rejection for a 500, a timeout, and a network drop.

### D11. Test strategy

- **Unit (mocked client)**: `rosterPersistence.test.ts` covers `PartySaveResult` shapes and the new `savePreferenceRows` throws via `createBuilder`. `useRoster.test.ts` covers field rollback (failed payload reverts, unrelated field survives). New `useParties.test.ts` (hoisted-mock pattern, `addToast` mocked) covers load error, retry, every row of the D5 table. `useAuth.test.ts` covers the rejection path.
- **MSW (real client)**: `src/test/mocks/handlers.ts` gains `createSupabaseRestErrorHandlers(tables, status = 500)` returning `http.all('*/rest/v1/:table', …)` handlers that answer with the given status and a PostgREST-shaped error body `{ message, code, details, hint }`. New `src/services/rosterPersistence.msw.test.ts` stubs `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (via `vi.stubEnv` before a dynamic import of the service module, since `DB_ENABLED` is evaluated at module load), starts a per-file server, and asserts that `load` and `loadParties` **reject** on a 500 and that `saveParty` resolves `{ partyId: null, membersSaved: false }`. This is the only test that exercises the real `@supabase/supabase-js` error mapping, which is exactly the assumption the whole change rests on.
- **Component**: `ErrorState.test.tsx` (role, message, retry, no-retry, label). `RosterPageLayout` / page tests: error branch renders `.error-state` and not `.empty-state`, new copy. `PartiesView.test.tsx`: error rung before empty, Retry invokes handler, modal stays open on `partyId: null`, closes on id. `RouteErrorBoundary.test.tsx`: throwing child renders the boundary; Reload calls a stubbed `location.reload`.
- **Storybook**: `ErrorState.stories.tsx`; error variants on `RosterPageLayout.stories.tsx` (rename `LoadError`) and `PartiesView.stories.tsx`.

## Risks / Trade-offs

- [Rename `isLoading` → `isInitialLoad` on `useParties` touches six wrappers and six pages] → mechanical, TypeScript catches every miss; pages currently ignore the old name anyway.
- [`PartySaveResult` type ripple through per-game party service tests] → per-game tests only assert wiring (tier/name/is_favorited); the return-shape assertions live once in `rosterPersistence.test.ts`.
- [Rollback double-failure window (D6)] → one-second window, requires two consecutive write failures on the same row; documented in the spec text.
- [Error toast on every failed favorite toggle could be noisy during an outage] → toasts auto-dismiss in 4 s and the load error surface already tells the user the DB is unreachable.
- [MSW test depends on `import.meta.env` timing] → `vi.stubEnv` + dynamic import is the documented Vitest pattern; the test is isolated in its own file so it cannot leak env into the hoisted-mock hook tests.
- [`role="alert"` on a persistent surface re-announces on every re-render in some screen readers] → the surface renders once per error and is replaced by the loader on Retry; acceptable.
- [Route boundary hides a render bug behind a generic message] → the boundary logs the error; the message is honest ("something went wrong") and Reload is the correct recovery for the common case.

## Migration Plan

No DB or data migration. Ship as one PR; every change is additive except the internal `saveParty` return type and the `useParties.isLoading` rename, both caught at compile time. Rollback is a revert.
