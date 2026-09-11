# Add Shared Loading State

## Why

Loading surfaces are visually indistinguishable from empty content: `RosterPageLayout`'s "Authenticating..." / "Loading database sync..." branches and `SelectionPage`'s auth check render static text inside the same dashed `.empty-state` box used for a genuinely empty roster, the route-level `Suspense` fallback is `null` (blank page during chunk load), and `PartiesView` has no loading state at all — during the initial DB load it shows the false empty message "No parties configured yet. Build your first team!". The user cannot tell "system working" from "nothing here" without reading, and sometimes not even then.

## What Changes

- New shared L3 `LoadingState` component: animated spinner-dot trio (reusing the existing `.spinner-dot` / `spinner-bounce` primitives) above a label, wrapped in `role="status"` with `aria-live="polite"`.
- New `.loading-state` style, visually distinct from `.empty-state` — no dashed border (dashed reads as "nothing here, add something"); dashed `.empty-state` becomes reserved for true empty/no-match states.
- `RosterPageLayout` auth-loading and initial-load branches render `LoadingState` instead of `.empty-state` text, with unified copy ("Checking sign-in…" / "Loading your roster…").
- `SelectionPage` auth-loading branch renders `LoadingState` with the same "Checking sign-in…" copy.
- `App.tsx` route `Suspense` fallback changes from `null` to a `LoadingState`.
- `PartiesView` gains an `isInitialLoad` prop and renders `LoadingState` before the empty-parties check; each game page wires the roster hook's `isInitialLoad` through its `PartiesTab` adapter.
- Storybook story for the new shared component (`LoadingState.stories.tsx`).

## Capabilities

### New Capabilities

- `shared-loading-state`: The shared `LoadingState` component contract (spinner + label, status semantics, `.loading-state` styling distinct from `.empty-state`) and its adoption across the loading surfaces: roster render ladder, parties tab initial load, selection page auth check, and the route-level Suspense fallback.

### Modified Capabilities

_None — no existing requirement changes. The roster render ladder's loading branches and the parties tab's pre-load rendering are not currently specced by `shared-roster` / `shared-parties`; their new loading behavior is owned by `shared-loading-state`._

## Impact

- **New files**: `src/components/LoadingState.tsx`, `LoadingState.test.tsx`, `LoadingState.stories.tsx`.
- **Modified**: `src/components/RosterPageLayout.tsx` (+ `.css` for `.loading-state`), `src/pages/SelectionPage.tsx`, `src/App.tsx`, `src/components/parties/PartiesView.tsx`, six per-game `PartiesTab.tsx` adapters and their page wiring, affected tests.
- **No DB, service, or hook-layer changes** — `isInitialLoad` already exists on every roster hook.
- **No new tokens or keyframes** — reuses `.spinner-dot`, `spinner-bounce`, and existing spacing/color tokens.
