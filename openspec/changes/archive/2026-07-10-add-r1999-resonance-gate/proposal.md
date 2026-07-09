## Why

R1999 arcanists sit on a long resonance track (0–15). Users want to spot arcanists that have _started_ resonance but aren't finished — the in-progress backlog — without eyeballing every card. That's a predicate filter, not a sort. The reusable `roster-predicate-filter` pattern already exists (introduced by the P5X rose gate); R1999 just needs to adopt it.

## What Changes

- Add a filter chip to the R1999 roster toolbar that narrows the displayed roster to arcanists with resonance in progress: `resonanceLevel > 0 && resonanceLevel < 15` (has progress, not maxed).
- The chip is off by default, togglable, page-local, and composes with the existing search + sort (intersection).
- Extend the R1999 `getFilteredRoster` to accept an optional predicate parameter, conforming to the existing `roster-predicate-filter` signature (P5X already does this; R1999's does not yet).
- No new data fields — `resonanceLevel` already exists on `R1999TrackedArcanist`. No type, service, DB, or migration changes.

## Capabilities

### New Capabilities

<!-- None. The shared boolean-predicate filter pattern already exists as roster-predicate-filter. -->

### Modified Capabilities

- `r1999-arcanist-detail`: Add a resonance-gate filter chip to the R1999 roster toolbar, wired through an extended `getFilteredRoster` that accepts an optional predicate (per the `roster-predicate-filter` pattern).

## Impact

- `src/hooks/reverse1999/useArcanists.ts` — `getFilteredRoster` gains an optional predicate parameter, passed through to the shared `filterRoster`.
- `src/pages/reverse1999/Reverse1999Page.tsx` — page-local filter state + chip in the toolbar `filterRow`, gate-aware `noMatchMessage`.
- `src/pages/reverse1999/Reverse1999Page.css` — **new** page-local file. The `.filter-row` / `.filter-chip` rules are NOT shared (they live page-local in P5xPage.css with P5X's accent baked in), so R1999 gets its own copy keyed on a new `--color-r1999-accent` token. Follow-up: promote the base rules to `controls.css` with a per-game accent variable so both games share one definition.
- `src/styles/design-tokens.json` / `tokens.css` — add `color.r1999.accent` (`#deb887`); `DesignTokens.stories.tsx` updated to show it.
- Tests: hook predicate filtering + page chip interaction.
- No DB change, no migration, no new dependencies.
