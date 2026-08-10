## Context

See proposal.md — Why. Current state: `mindscapeMaxed` was a single boolean;
the first pass of this change already landed `mindscapeProgress` 0–2 edited via
`SegmentedButtons`. Skill progress is still the `skillsLeveled` / `roseMaxed`
boolean pair with a coupling invariant enforced at three layers: coupled
`ConfirmCheckbox`es in the card, the `updateSkillProgress` normalization body
in the hook, and the `p5x_thief_skill_gate` CHECK constraint in the DB. Both
dimensions are monotone two-milestone progressions (the second milestone gates
behind the first), so they should share one design. The Awareness and
Weapon-forge rows are the in-repo precedent for ordered investment scales
rendered as `SegmentedButtons` with investment coloring.

## Goals / Non-Goals

**Goals:**

- One ordered field per dimension capturing the three milestone states, with
  lossless backfill
- Identical edit-section design for Mindscape and Skills (segmented milestone
  row, deselect-to-0)
- Keep updater plumbing declarative (plain clamped `makeFieldUpdater`s); delete
  the skill coupling body and the pair CHECK constraint

**Non-Goals:**

- Per-node Mindscape or per-skill tracking (unchanged from original decisions)
- Changing the summary-chip presentations beyond what the field swap requires
  (Skills keeps "Skills ✓" / "🌹 Gated"; the rose-gated filter behavior is
  unchanged)
- Mindscape material tracking or Awareness tie-ins

## Decisions

**Design review — checkbox pair vs segmented progression.** The checkbox pair
represents four states of which one is invalid, so the invariant must be
enforced at three layers (UI coupling, hook normalization, DB pair CHECK); it
also costs two confirm-armed clicks per milestone. The segmented ordered field
makes the invalid state unrepresentable, needs only a range CHECK, is one tap,
and matches the card's dominant idiom (Awareness, rarity, forge). A third
option — a cumulative "milestone stepper" where every rung ≤ active renders
lit — was rejected: it would add a new `SegmentedButtons` prop (an L3 design
system change plus Storybook churn) and break the single-active idiom that
Awareness already uses for an equally cumulative in-game scale. **Verdict:
segmented progression for both dimensions.**

**Field shapes:** `mindscapeProgress: number` 0–2 (0 = not started, 1 = Outer
maxed, 2 = Inner maxed = whole tree) and `skillProgress: number` 0–2 (0 = not
started, 1 = Lv8 incense cap, 2 = rose-maxed to Lv10), both default `0`.
Replaces `mindscapeMaxed` and the `skillsLeveled` / `roseMaxed` pair outright.
Ordered integers match the `awareness` / `weaponForge` pattern and make
invalid milestone combinations unrepresentable.

**Hook updaters:** two plain `makeFieldUpdater` entries —
`updateMindscapeProgress` and `updateSkillProgress`, both `{ clamp: [0, 2] }`.
The custom `updateSkillProgress` coupling body (read current state, coerce the
pair) is deleted; the exported name is kept so page wiring stays a rename, but
its signature becomes `(id, value: number)`. Card props:
`onUpdateMindscapeProgress` / `onUpdateSkillProgress`, both `(id, value:
number) => void`.

**DB migrations:** one file per dimension, same recipe: add the new `SMALLINT
NOT NULL DEFAULT 0 CHECK (BETWEEN 0 AND 2)` column, backfill, drop the old
column(s). Mindscape: `mindscape_progress = 2 WHERE mindscape_maxed`. Skills:
`skill_progress = 2 WHERE rose_maxed`, `1 WHERE skills_leveled AND NOT
rose_maxed`; drop `p5x_thief_skill_gate` explicitly before dropping the pair
columns (the table-level CHECK references both). Backfills are lossless — the
old states map 1:1 onto the new values.

**Edit controls:** identical `SegmentedButtons` rows in the existing
`ProgressSection`s — Mindscape: "Outer" (`'1'`) / "Inner" (`'2'`), class
`mindscape-row`; Skills: "Lv8" (`'1'`) / "Rose Lv10" (`'2'`), class
`skills-row`. Both `coloring="investment"`, `allowDeselect` (deselect → 0).
The Skills `ConfirmCheckbox` pair and the `.skill-toggles` CSS rule go away —
milestone selection is one tap and reversible, so no confirm step is
warranted (same trade already accepted for Awareness/forge). Section value
readouts: Mindscape "Maxed" / "Outer" / "—"; Skills "Maxed" / "Rose-gated" /
"—".

**Chip derivations:** Mindscape — "MS ✓" at 2, "MS O" at 1, absent at 0,
colored `getProgressStyle(progress, 0, 2)`. Skills — presentation unchanged
("Skills ✓" at 2, "🌹 Gated" at 1, absent at 0), now derived from
`skillProgress` with the same `getProgressStyle(progress, 0, 2)` color rule.
Rose-gated filter predicate becomes `skillProgress === 1`.

## Risks / Trade-offs

- [Backfill overstates progress for players who marked flags loosely] →
  Accepted: old semantics map 1:1; any mismatch is one tap to fix.
- [Dropping old columns breaks a deploy window where stale client code still
  selects them] → Vercel deploys atomically with the migration applied first;
  stale clients hold pre-fetched data only. Same pattern as prior column
  replacements; accepted.
- [Losing the confirm step makes accidental skill toggles easier] → Accepted:
  segmented milestones are single-tap reversible, same as Awareness/forge.
- [Chip text "MS O" is cryptic] → Accepted for width budget; the edit section
  spells out Outer/Inner, and ✓ remains the terminal state.

## Migration Plan

1. Apply both migrations (add column → backfill → drop constraint/columns) in
   Supabase.
2. Deploy client referencing only the new columns.
3. Rollback: re-derive the old columns from the new values if ever needed
   (`mindscape_maxed = mindscape_progress = 2`; `skills_leveled =
skill_progress >= 1`; `rose_maxed = skill_progress = 2`).
