## Why

Gluttony is R1999's universal psychube-amplification material (a dupe substitute): players
spend it to raise an equipped psychube's amplification toward the A5 cap. Users want to spot
arcanists whose equipped psychube is _not yet_ maxed — the amplification backlog — without
eyeballing every card. That's a predicate filter, not a sort.

The `roster-predicate-filter` mechanism already exists and R1999 already adopts it (the resonance
gate). The `getFilteredRoster` predicate seam, the shared `.filter-row` / `.filter-chip` styles in
`controls.css`, and the `--color-r1999-accent` token are all already in place. This change adds a
_second_ gate chip alongside the resonance one — the first case of two gates coexisting on one page.

## What Changes

- Add a second filter chip to the R1999 roster toolbar that narrows the roster to arcanists whose
  equipped psychube is below max amplification: `psychubeName !== null && psychubeAmplification < 5`
  (a psychube is equipped and its amplification is not yet A5).
- Arcanists with **no** psychube equipped are excluded — Gluttony amplifies an _existing_ psychube,
  so "no psychube" is a different gap, not "not maxed" (mirrors the resonance gate requiring
  `resonanceLevel > 0` before gating). _This exclusion is a default (the clarifying question timed
  out); drop the `!== null` guard if no-psychube arcanists should surface too._
- The resonance gate's existing gate-specific empty message ("No arcanists with resonance in
  progress.") is preserved; the generic "active filters" message appears only when both gates are on.
- The chip is off by default, togglable, page-local, and composes with search, sort, **and the
  existing resonance gate** as an intersection (an arcanist must satisfy every active predicate).
- No hook, service, type, token, CSS, DB, or migration changes — every seam already exists. Wiring
  is confined to `Reverse1999Page.tsx`.

## Capabilities

### New Capabilities

<!-- None. The shared boolean-predicate filter pattern already exists as roster-predicate-filter,
     and R1999 already adopts it via the resonance gate. -->

### Modified Capabilities

- `r1999-arcanist-detail`: Add a gluttony-gate (psychube amplification) filter chip to the R1999
  roster toolbar, reusing the existing `getFilteredRoster` predicate seam, and define how it
  composes with the existing resonance gate (intersection of all active gate predicates).

## Impact

- `src/pages/reverse1999/Reverse1999Page.tsx` — page-local `gluttonyGateFilter` state; the
  `filteredGetRoster` callback composes all active gate predicates into a single predicate
  (intersection) passed to `getFilteredRoster`; a second `.filter-chip` in the existing
  `filterRow`; gate-aware `noMatchMessage` covering the combined filter states.
- Tests: page chip interaction (toggle, narrows to equipped-not-maxed, composes with the resonance
  gate and with search, gate-specific empty message).
- No hook change — `getFilteredRoster` already accepts an optional predicate. No CSS change — the
  `.filter-row` / `.filter-chip` rules already live in `controls.css`. No token — `--color-r1999-accent`
  already exists. No DB, migration, or new dependencies.
