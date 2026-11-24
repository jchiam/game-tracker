# Proposal

## Why

The CZN roster has search and sort but no predicate filters, so "who still needs work" means scanning every card. R1999, P5X, and ZZZ already declare their grindable bottlenecks as filter facets through the shared `roster-predicate-filter` pattern. CZN has the same kinds of bottlenecks: the level cap and Unconscious Awakening, Potential, Partner investment, and Memory Fragment coverage.

## What Changes

- Declare four CZN roster filter facets (eight chips) on `CznPage`, in card-section order:
  - **Level** (`one`): `Under Lv 60` (`level < 60`) and `Awakening` (`level >= 60 && level < 62`, Unconscious Awakening pending). The two are mutually exclusive.
  - **Potential**: one chip, `Not attained` (`!potentialAttained`). It renders without a facet label.
  - **Partner** (`any`):
    - `None equipped` is **exclusive** (`partnerId === null`).
    - `Under Lv 60` (`partnerId !== null && partnerLevel < 60`).
    - `Off-build`: a Partner is equipped, the preference list is non-empty, and the equipped Partner is not in that list.
  - **Fragments** (`any`): `Open slots` (fewer than 6 slots equipped) and `No build` (no main-stat, substat, or target-set preference).
- Extract the fragment-preference presence check the scorer already does inline into an exported `hasFragmentPreferences`. The scorer and the `No build` chip will share it.
- Deliberately left without a chip:
  - Manifest Ego and Partner Manifest Ego are dupe-bound, matching the precedent of R1999 portraits and P5X awareness.
  - Class, attribute, and rarity are already covered by search.
  - Fragment set mismatch against `targetSetIds` is deferred.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `czn-combatant-detail`: adds the "CZN roster filter facets" requirement (facets, chips, predicates, exclusivity, no-match copy), mirroring `r1999-arcanist-detail` and `p5x-thief-detail`.

## Impact

- `src/pages/chaos-zero-nightmare/CznPage.tsx`: new `FILTER_FACETS` declaration passed as `filterChips` to `useRosterView`. The accent `var(--color-czn-rarity5)` is already wired.
- `src/utils/fragmentScoring.ts`: exported `hasFragmentPreferences`, reused by `calculateFragmentScore`. Scoring behaviour does not change.
- Tests: `CznPage.test.tsx` (config wiring and rendering) and `fragmentScoring.test.ts` (the helper).
- No DB, type, token, CSS, or shared-hook changes.
