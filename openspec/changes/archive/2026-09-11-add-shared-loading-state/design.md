# Design — Add Shared Loading State

## Context

Four loading surfaces exist today, three broken, one absent:

1. `RosterPageLayout.tsx:150-157` — "Authenticating..." / "Loading database sync..." rendered inside `.empty-state` (dashed box, static text). Identical to empty-roster / no-match rendering except text content.
2. `SelectionPage.tsx:23-29` — "Checking authentication..." static text in `.selection-empty`.
3. `App.tsx:17` — `<Suspense fallback={null}>` — blank page during lazy route chunk load.
4. `PartiesView.tsx:184-187` — no loading state; during initial DB load the tab shows the false empty message "No parties configured yet. Build your first team!".

The only good loader is `GameCardShell`'s image spinner: three `.spinner-dot` elements (`controls.css`) animated by `spinner-bounce` (`animations.css`). The reduced-motion kill switch in `animations.css` already freezes infinite animations after one iteration.

## Goals / Non-Goals

**Goals:**

- One shared `LoadingState` component used by every loading surface.
- Loading visually distinct from empty at a glance: motion + no dashed border.
- Reserve the dashed `.empty-state` affordance exclusively for true empty / no-match states.
- Fix the `PartiesView` false empty state.
- Unified loading copy; accessible status semantics.

**Non-Goals:**

- Skeleton cards for the roster grid (possible follow-up; spinner-based fix resolves the complaint at a fraction of the cost).
- Any change to hooks, services, or DB — `isInitialLoad` already exists on every roster hook.
- New design tokens or keyframes.
- Reworking `GameCardShell`'s image spinner or `SavingToast` (both already correct).

## Decisions

### D1 — New L3 component `LoadingState`, not a `.empty-state` variant class

`src/components/LoadingState.tsx`:

```tsx
interface LoadingStateProps {
  label: string;
}
export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state-dots" aria-hidden="true">
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
      <p>{label}</p>
    </div>
  );
}
```

Rationale: a modifier class on `.empty-state` (e.g. `.empty-state.loading`) would keep the semantic collision in markup and invite divergence per call site. A component makes the spinner markup, ARIA, and class name impossible to hand-roll wrong — same reasoning as `ProgressSection` / `GameBadge`. Alternative rejected: per-surface inline spinners (duplication, drift).

### D2 — Style in `controls.css` next to `.spinner-dot`

`.loading-state`: `grid-column: 1 / -1` (so it spans `.roster-grid` like `.empty-state` does), centered flex column, `gap: var(--spacing-md)`, generous padding (`var(--spacing-3xl) var(--spacing-xl)`), `color: var(--color-text-secondary)`, **no border, no background** — borderless centered spinner + label reads as transient system activity; the dashed box reads as a placeholder inviting content. `.loading-state-dots`: flex row, `gap: var(--spacing-2)`. Reuses `.spinner-dot` and `spinner-bounce` verbatim — no new keyframes.

Placement rationale: `.spinner-dot` and its animation already live in `controls.css`; colocating avoids a new stylesheet for ~15 lines and keeps L2 ownership. Alternative rejected: `LoadingState.css` per-component file — convention allows it, but the rule composes L2 primitives and belongs beside them.

### D3 — Copy: two phrases, one meaning each

- Auth in flight: **"Checking sign-in…"** (replaces "Authenticating..." and "Checking authentication...").
- Roster/parties data in flight: **"Loading your roster…"** (replaces "Loading database sync..."); parties tab uses **"Loading your lineups…"** built from the existing `nouns.partiesLower` config (`Loading your ${nouns.partiesLower}…`).
- Route chunk: **"Loading…"**.

Uses the ellipsis character `…` (single glyph) consistently.

### D4 — `PartiesView` gains `isInitialLoad?: boolean`

Checked after the sign-in gate, before the empty-parties check: `if (isInitialLoad) return <LoadingState label={...} />` inside `.parties-grid`'s spot (rendered in place of the grid contents, keeping the header + create button visible — the header is not data-dependent). Optional prop defaulting to `false` keeps the change non-breaking for tests that don't pass it. Each game's `PartiesTab` adapter forwards the roster hook's existing `isInitialLoad`; pages already have it in scope.

### D5 — `Suspense` fallback

`fallback={<LoadingState label="Loading…" />}` in `App.tsx`. `LoadingState` has no context dependencies, safe outside route/layout wrappers. `grid-column` is inert outside a grid container.

### D6 — `RosterPageLayout` ladder branches

The two loading branches swap `.empty-state` divs for `<LoadingState label="Checking sign-in…" />` / `<LoadingState label="Loading your roster…" />`. Ladder order unchanged. Error, auth-gate, empty, and no-match branches unchanged.

## Risks / Trade-offs

- [Tests asserting old copy ("Authenticating...", "Loading database sync...") break] → sweep page/layout tests, assert new copy or `role="status"`; this is the bulk of the diff surface.
- [`role="status"` + spinner during long loads announces nothing if load hangs] → out of scope; `LoadErrorState` already covers failure, and Supabase client has a 10 s timeout.
- [Borderless loading state on `SelectionPage` (`.selection-empty` replaced) shifts that page's look] → acceptable; the page shows it only during the brief auth check.
- [Six `PartiesTab` adapters touched for one prop] → mechanical; adapters are thin config files by design.

## Migration Plan

Pure frontend refactor, single PR, no data or API migration. Rollback = revert commit.

## Open Questions

None.
