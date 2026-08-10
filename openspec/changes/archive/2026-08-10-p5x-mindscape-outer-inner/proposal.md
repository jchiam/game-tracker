## Why

P5X's Mindscape node tree has two halves — Outer and Inner — completed in
sequence: Inner nodes are blocked until Outer is done. The current single
`mindscapeMaxed` boolean can't represent the intermediate "Outer done, Inner in
progress" state, so partial Mindscape investment is invisible in the tracker.

Skill progress has the exact same shape — a monotone two-milestone progression
(skills to the Lv8 incense cap, then rose-maxed to Lv10) — but is modeled as
two coupled booleans whose invalid combination must be fended off at three
layers (coupled toggles, hook normalization, DB CHECK). The two dimensions
operate under the same circumstance and should share one design.

## What Changes

- Replace the `mindscapeMaxed` boolean with an ordered progression field
  `mindscapeProgress` (integer 0–2): 0 = not started, 1 = Outer maxed,
  2 = Inner maxed (which means the whole tree is done, since Inner completes
  after Outer).
- Replace the `skillsLeveled` / `roseMaxed` boolean pair with the same ordered
  shape: `skillProgress` (integer 0–2): 0 = not started, 1 = skills at the Lv8
  incense cap, 2 = rose-maxed to Lv10. The invalid rose-without-Lv8 state
  becomes unrepresentable, deleting the coupling updater and the paired CHECK
  constraint. Rose-gated is now simply `skillProgress === 1`.
- **BREAKING** (schema): one migration per dimension — add the new 0–2 column
  (CHECK constraint), backfill from the old column(s) (`mindscape_maxed = true`
  → 2; `rose_maxed` → 2 else `skills_leveled` → 1), drop the old columns and
  the `p5x_thief_skill_gate` constraint.
- Both edit sections render the identical control: a two-option
  `SegmentedButtons` row with investment coloring and deselect-to-0 —
  "Outer" / "Inner" for Mindscape, "Lv8" / "Rose Lv10" for Skills — following
  the Awareness / Weapon-forge row pattern. The Skills `ConfirmCheckbox` pair
  goes away.
- Summary chips: Mindscape gains a graded chip ("MS ✓" at 2, "MS O" at 1, none
  at 0). Skills chips keep their existing presentation ("Skills ✓" / "🌹 Gated")
  driven by the new field.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-thief-detail`: The Mindscape requirements (field, summary indicator,
  edit toggle) and the skill-progress requirements (aggregate fields,
  invariant, rose-gated indicator, edit controls, rose-gated filter) change —
  both dimensions become three-state ordered progressions edited via
  identical segmented rows.

## Impact

- `src/types.ts` — `P5xTrackedThief` / `P5xThiefPatch` field replacements
- `supabase/migrations/` — two migrations (mindscape split, skill progression)
- `src/services/persona-5-phantom-x/thiefService.ts` — column map, insert
  defaults, select list, `fromRow`
- `src/hooks/persona-5-phantom-x/useThieves.ts` — both dimensions become plain
  clamped `makeFieldUpdater`s; the `updateSkillProgress` coupling body is
  deleted
- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — twin segmented
  sections, chip derivations
- `src/pages/persona-5-phantom-x/P5xPage.tsx` — handler wiring + rose-gated
  filter predicate
- Colocated tests for all of the above
