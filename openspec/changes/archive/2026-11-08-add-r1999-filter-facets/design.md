## Context

See proposal.md — Why. The shared roster view already owns Chip Facets (`RosterFilterFacet` in `src/hooks/useRosterView.ts`, design `2026-11-08-add-exclusive-filter-chip-groups` D1–D8): a facet is a labelled dimension with `mode: 'any' | 'one'`, `one` resolves radio-exclusively inside `toggleChip`, the layout renders one `.filter-facet` row per facet (label at two or more chips, joined pill for `one`), the held ghost tag and collapsed summary pills compose `{facet} · {chip}`, and a block with two or more rows is collapsible. This change adds one thing to that machinery — an `exclusive` flag on a chip inside an `any` facet (D3, D8) — and is otherwise page data and spec.

R1999 facts that shape the chip set (`R1999TrackedArcanist` in `src/types.ts`, `ArcanistCard.tsx`):

- `resonanceLevel` 0–15 — a grind counter; the existing chip keeps `> 0 && < 15` (the card's cap, not the "recommended stop at 10").
- `euphoriaStage` 0–4 — a grind counter that exists only for arcanists whose catalog entry has `hasEuphoria: true`; the card hides the `E{n}` chip and the Euphoria section otherwise. Tracked rows are built from the DB row merged with the catalog entry (`rosterPersistence.ts` `base` merge), so `hasEuphoria` is present on every tracked arcanist.
- `portraitLevel` 0–5 — dupe-bound (excluded by the P5X rule: no chips for gacha-bound dimensions).
- `psychubeName | null`, `psychubeLevel` 1–60, `psychubeAmplification` 1–5 — the equipped psychube; amplification is item-gated (the existing "gluttony" chip).
- Card summary order: `Lv` → `P` → `R` → `E`; the Psychube is an edit section only.

## Goals / Non-Goals

**Goals:**

- Every grindable R1999 bottleneck is a chip, in the card's order, in the P5X vocabulary.
- Disjoint milestone states (`0` vs. in-progress) are `one` facets so they cannot be AND-ed into an empty roster.
- Euphoria chips never show arcanists that have no Euphoria system.

**Non-Goals:**

- Any shared change beyond the exclusive flag: no new facet mode, no nested facets, no dependency/enablement rules between chips.
- A Portrait chip, a Level chip (the `Lv` sort covers it), or a "Resonance at the recommended 10" chip.
- Replacing `ArcanistCard`'s name-based `ALL_ARCANISTS` lookup for `hasEuphoria` (it works; out of scope).
- Other games (ZZZ's `🐹 Gated` follow-up stays a follow-up).

## Decisions

### D1 — Three facets, seven chips

| facet     | mode  | key                   | label           | predicate                                               | onTitle                                                    | noMatch                                            |
| --------- | ----- | --------------------- | --------------- | ------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Resonance | `one` | `resonanceNotStarted` | `Not started`   | `resonanceLevel === 0`                                  | Show only arcanists who have not started resonance         | No arcanists without resonance started.            |
| Resonance | `one` | `resonanceInProgress` | `In progress`   | `resonanceLevel > 0 && resonanceLevel < 15`             | Show only arcanists with resonance in progress             | No arcanists with resonance in progress.           |
| Euphoria  | `one` | `euphoriaNotStarted`  | `Not started`   | `hasEuphoria && euphoriaStage === 0`                    | Show only Euphoria arcanists who have not started Euphoria | No Euphoria arcanists without Euphoria started.    |
| Euphoria  | `one` | `euphoriaInProgress`  | `In progress`   | `hasEuphoria && euphoriaStage > 0 && euphoriaStage < 4` | Show only Euphoria arcanists with Euphoria in progress     | No Euphoria arcanists with Euphoria in progress.   |
| Psychube  | `any` | `psychubeNone`        | `None equipped` | `psychubeName === null` (exclusive)                     | Show only arcanists with no psychube equipped              | No arcanists without a psychube.                   |
| Psychube  | `any` | `psychubeLevel`       | `Under Lv 60`   | `psychubeName !== null && psychubeLevel < 60`           | Show only arcanists with an equipped psychube below Lv 60  | No arcanists with a psychube below Lv 60.          |
| Psychube  | `any` | `psychubeAmp`         | `Under A5`      | `psychubeName !== null && psychubeAmplification < 5`    | Show only arcanists with an equipped psychube below A5     | No arcanists with un-maxed psychube amplification. |

Chip keys are page-local and never persisted, so renaming `resonance` → `resonanceInProgress` and `gluttony` → `psychubeAmp` has no data impact. Chip labels repeat across facets (`Not started` twice, `In progress` twice); that is by design — the facet label supplies the dimension in the row, the ghost tag, and the summary pill (`Euphoria · Not started`), and the accessible context is the `role="group"` label plus the chip text. Tests that need one specific chip select it within its group.

### D2 — Vocabulary: counters say `Not started` / `In progress`

P5X's milestone fields have named halves (`No Outer` / `No Inner`, `Under Lv 8` / `Rose-gated`). Resonance and Euphoria are plain counters with no named halves, so their chips name the state, not a missing part: `Not started` (`0`) and `In progress` (between `0` and the cap). Psychube chips reuse P5X's equipment vocabulary: `None equipped`, `Under Lv 60`, `Under A5` (the `A5` form matches the card's `A1–A5` amplification labels). No glyph prefixes: the card summary uses `R{n}` / `E{n}`, not `💠` / `🍽️`, so unlike P5X's `🌹` there is nothing to stay consistent with. No `<`, `✗`, or abbreviation.

### D3 — `one` mode for Resonance and Euphoria, `any` with an exclusive chip for Psychube

`Not started` and `In progress` are disjoint within a counter (`0` vs. `1..cap-1`), so each pair is a `one` facet and renders as one joined segment; the hook guarantees at most one active member, so AND composition across the three facets stays correct. The three Psychube chips fit neither mode: `Under Lv 60` and `Under A5` routinely co-occur and must intersect (`one` would forbid it), while `None equipped` rules both out — a level or amplification question presumes an equipped psychube (`any` would let the user AND them into a silent empty roster). So Psychube is `any` with `None equipped` declared `exclusive` (D8): it clears the threshold chips, either threshold chip clears it, and the two threshold chips still intersect.

Rejected: a nested `one` facet whose members can be chips or `any` sub-groups (same behaviour, recursive types and flattening, no clean joined-pill rendering around a cluster); splitting Psychube into two rows (loses either `None equipped` or the intersection).

### D4 — Euphoria gating reads `hasEuphoria` off the tracked row

Both Euphoria predicates are guarded by `a.hasEuphoria` so an arcanist without the system is excluded from both chips rather than appearing under `Not started` forever. The flag comes from the catalog merge on load (every tracked row carries its catalog fields), so the predicate needs no `ALL_ARCANISTS` lookup. The single-chip no-match copy says "Euphoria arcanists" so a roster of non-Euphoria arcanists reads as "none of yours have Euphoria", not as a bug.

### D5 — Order: Resonance → Euphoria → Psychube

The card's section order minus the excluded dimensions (Level: sort; Portrait: dupes). Euphoria precedes Psychube because the card's summary shows `E{n}` and the Psychube only in the edit sections.

### D6 — The collapsible block arrives on R1999 by threshold alone

Three rows ≥ 2, so the shared disclosure header renders. Nothing R1999-specific is added: default open at or above 600px, collapsed below; summary pills labelled `Resonance · In progress`, `Euphoria · Not started`, `Psychube · Under A5`, etc. The page test only asserts the wiring (header present, pill label composition, removing a pill clears the chip).

### D7 — Spec placement

`r1999-arcanist-detail` removes its four filter requirements (resonance-gate predicate, resonance-gate chip, gluttony-gate predicate, gluttony-gate chip) with migration notes and adds one consolidated "R1999 roster filter facets" requirement, mirroring the P5X consolidation. `roster-predicate-filter` has its Chip facets requirement MODIFIED for the exclusive flag and the divider; `shared-roster` has its view-hook requirement MODIFIED so the enumerated exclusivity semantics cover exclusive `any` chips.

### D8 — Exclusive chips: a flag, not a mode

```
RosterFilterChip<T>.exclusive?: boolean     // meaningful only inside an `any` facet
```

`toggleChip` generalises the `one` rule in place:

```
next = new Set(prev)
if next.has(key):               next.delete(key)
else:
  f = facetOf(key)
  if f:
    clearAll = f.mode === 'one' || chip(key).exclusive
    for c in f.chips: if clearAll || c.exclusive: next.delete(c.key)
  next.add(key)
```

Still one fresh `Set` per click, so the projection-change signal is untouched; `one` behaviour is byte-for-byte the old path (`clearAll` true). A `one` facet is the degenerate case "every chip exclusive", which is why no third mode is introduced. The descriptor chip carries `exclusive: boolean` (true only for an `any`-facet member with the flag — bare chips and `one` members report false) so the layout composes nothing. Predicate composition, held detection, no-match copy, and summary pills are unchanged: the facet simply never holds a contradictory active pair.

Rendering: in an `any` row the layout inserts `<span class="filter-facet-divider" role="separator" aria-orientation="vertical">` wherever consecutive chips differ in `exclusive`, so exclusive chips declared first read as `(None equipped) │ (Under Lv 60) (Under A5)`. One rule in `controls.css`: `align-self: stretch; width: 1px; margin-block: var(--spacing-xs); background: var(--color-ui-border)`. Declaring exclusive chips first is a convention, not a constraint — the divider is placed per transition.

_Why not a joined segment for the exclusive chip:_ joined means "pick one of these"; here the message is "this one or any combination of those", which a divider says and a pill does not.

## Risks / Trade-offs

- [Euphoria arcanists are a minority of most rosters, so the Euphoria facet often matches a handful or nothing] → the single-chip no-match copy names "Euphoria arcanists" explicitly; the facet earns its row because stage material is one of the game's scarce grinds.
- [`euphoriaStage === 0` conflates "unlocked, not started" with "not yet unlocked for this arcanist"] → the tracker has no unlock flag; both states want the same attention. Accepted.
- [Resonance `In progress` stops at `< 15`, though many players stop at 10] → unchanged from the existing predicate; adding a "recommended stop" chip is a separate decision.
- [Existing page-test assertions on `💠 Resonating` / `🍽️ Amplifying` and their ghost tags break] → updated in the same change; the hook already tests facet semantics, so page tests stay wiring-only.
- [The exclusive flag is a second exclusivity vocabulary next to `mode: 'one'`] → the flag is the general rule and `one` its all-exclusive special case; the toggle implements both in four lines and the spec states the equivalence.
- [A divider can land at the start of a wrapped line in a narrow `any` row] → cosmetic; the three Psychube chips fit one line above 360px, and the chips still read correctly without it.
- [Three rows push the first card down on desktop] → the shared disclosure handles phones; desktop keeps the block open as every other facet game does.
