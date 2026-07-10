## Context

`src/services/persona-5-phantom-x/thiefService.ts` maps DB rows to `P5xTrackedThief`
via the shared `createRosterPersistence` config. Two seams build the preference state:

- `fromRow(row, base)` builds the base tracked object, seeding
  `revelationPreferences: { ...defaultRevelationPreferences }`.
- `extras.mapRow(row, tracked)` enriches it: it constructs a `prefs` object by spreading
  `defaultRevelationPreferences`, rebuilds `mainStats` fresh, then `push`es preference
  rows into the per-category arrays, and returns `{ ...tracked, revelations, revelationPreferences: prefs }`.

`defaultRevelationPreferences` is a single module-level const. Its `subStats: []` array is
allocated once at module load and lives for the whole app session.

The bug: in `mapRow`, the `prefs` literal spreads the default (copying `subStats` **by
reference**) and rebuilds only `mainStats`. So `prefs.subStats` **is** the module-level
array. Line `prefs.subStats.push(...)` mutates that shared array on every thief and every
load. Symptoms: cross-thief bleed ("shows things I never input"), doubling under StrictMode
double-load / session refresh / retry ("duplicated on first input and re-render"), and
monotonic growth ("corrupts over time"). `mainStats` is immune purely because it is rebuilt
fresh — which is exactly why substats alone corrupt.

## Goals / Non-Goals

**Goals:**

- Guarantee each loaded Thief's `revelationPreferences` (and all nested arrays) is a fresh,
  independent allocation — no aliasing of the module default or of another Thief.
- Lock the fix with a regression test that fails on the current code.

**Non-Goals:**

- No DB migration, schema, or type change.
- Not fixing `PreferenceChain` add-default dedup (cosmetic, separate).
- Not fixing `savePreferenceRows` swallowed delete errors / missing unique constraint
  (robustness, separate — the DB is correct for this bug).

## Decisions

**Decision: Rebuild `subStats` fresh in the `prefs` literal (mirror `mainStats`).**

In `extras.mapRow`, change the `prefs` initializer to also own a fresh `subStats: []`:

```js
const prefs: P5xRevelationPreferences = {
  ...defaultRevelationPreferences,
  mainStats: { moon: [], star: [], sky: [] },
  subStats: [],
};
```

Rationale: minimal, local, and consistent with the existing `mainStats` treatment. The
spread still supplies the scalar fields (`heavensSetId`, `spaceSetId` = null); the two array
groups are explicitly re-owned.

_Alternative considered — deep-clone the default via `structuredClone`/factory function:_
cleaner in principle (a `makeDefaultPreferences()` factory returning fresh state), but a
broader change. Preferred as a defensive follow-up, not required to kill the bug. If adopted,
`fromRow` and the hook's `createTrackedThief` would call the same factory.

**Decision: Also re-own arrays in `fromRow`.**

`fromRow` seeds `revelationPreferences: { ...defaultRevelationPreferences }`, which aliases
the same arrays. It is currently masked because `mapRow` always overwrites the field, but the
aliasing is latent and would resurface if the extras seam changed. Give `fromRow` fresh arrays
too (spread + explicit `mainStats`/`subStats`), so the base object is self-consistently safe.

**Decision: Regression test asserts reference-distinctness and no-doubling.**

Add a `thiefService.test.ts` case: mock a DB payload with two thieves both carrying `sub_stats`
rows, run the loader twice, and assert (a) the two thieves' `subStats` are different references,
(b) neither equals a re-imported default reference / mutating one does not affect the other, and
(c) the second load yields the same row count as the first (no accumulation).

## Risks / Trade-offs

- [Existing corrupted DB rows persist] → This fix stops future corruption but does not clean up
  duplicate `p5x_revelation_preferences` rows already written by the buggy client. Mitigation:
  because saves are delete-then-insert, the next time the user edits a thief's substat chain the
  stale rows for that thief are deleted and replaced. No migration included; call out in the PR.
- [Spread-then-override is easy to regress] → A future edit could drop the explicit `subStats: []`
  and reintroduce aliasing. Mitigation: the regression test guards it.

## Open Questions

- Adopt a `makeDefaultPreferences()` factory now (broader, DRY) vs. the minimal per-literal fix?
  Leaning minimal fix for this change; factory as an optional follow-up.
