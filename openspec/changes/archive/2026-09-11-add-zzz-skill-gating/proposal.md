# Add ZZZ aggregate skill gating

## Why

The five ZZZ combat-skill maxed booleans shipped in `fix-zzz-core-skill-and-skill-flags` record only
the finished/unfinished state of each track. They cannot express the one intermediate state the
player actually farms toward: skills raised to the base Lv. 11 cap and parked there, waiting on a
**Hamster Cage Pass** — the rare, supply-limited material that alone unlocks the Lv. 11 → 12
upgrade on every track. P5X solved the identical problem (skills at the Lv8 incense cap, waiting on
a rose) with a single aggregate `skill_progress` 0–2 field, a gated summary badge, and a roster
filter chip that surfaces the farm list. ZZZ should adopt the same shape.

Per-track granularity was considered and rejected in favour of the P5X aggregate: the tracker's
question is "is this agent's skill investment done, parked at the Pass gate, or untouched", not
"which of the five tracks is done". The aggregate also collapses five columns into one and reuses
the proven P5X card and filter design wholesale.

## What Changes

- **BREAKING (schema + tracked shape)**: the five `skill_*_maxed` booleans on `zzz_tracked_agents`
  are replaced by a single `skill_progress SMALLINT NOT NULL DEFAULT 0 CHECK (0–2)`: `0` not
  started, `1` all five combat skills at the base Lv. 11 cap (Hamster Cage Pass-gated), `2` pushed
  past the Pass gate to the Lv. 12 max. Existing rows backfill `2` where all five booleans are
  `true`, `0` otherwise (the booleans cannot express the gated state, and a partially-maxed set has
  no faithful aggregate value — see design.md), then the boolean columns are dropped.
- The agent card's "Skills at Lv12" `ToggleChips` row is replaced by a two-option
  `SegmentedButtons` row ("Lv11" / "Pass Lv12", investment coloring, deselect to 0) — the identical
  control design as the P5X Skills row and the adjacent Mindscape row.
- The collapsed `Skl n/5` count chip is replaced by a conditional chip: "Skills ✓" at progress 2, a
  "🐹 Gated" badge at progress 1, and no chip at 0, keeping untouched cards clean.
- The ZZZ roster toolbar gains a "🐹 Gated" filter chip (`skillProgress === 1`) composing with
  search and sort, per the shared `roster-predicate-filter` pattern — the ZZZ analogue of the P5X
  "🌹 Gated" chip, including held-card ghost tags and a filter-specific empty state.
- `ToggleChips` loses its only call site but is **kept**: it is a specced, storied shared primitive
  and the designated home for the N2E awakening row. Only the SegmentedButtons call-site wording in
  `shared-ui-components` changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `zzz-agent-detail`: the two combat-skill flag requirements are removed and replaced by aggregate
  skill-progress requirements (field + migration, gated summary indicator, edit control, roster
  filter chip); the card-composition requirement's summary chip and edit-section wording updates.
- `shared-ui-components`: the SegmentedButtons call-site paragraph updates — the ZZZ Skills row
  becomes a two-option single-exact `SegmentedButtons` row, and the ToggleChips referral keeps only
  the N2E awakening row.

## Impact

- **Schema**: one migration (`20260910000000_zzz_skill_progress.sql`) — add `skill_progress` with
  range CHECK, backfill from the five booleans, drop them. Applied to the live DB by Jonathan.
- **Types**: `ZzzTrackedAgent` / `ZzzAgentPatch` drop the five boolean keys, gain `skillProgress`.
- **Service**: `agentService.ts` column map, select list, and insert defaults swap five fields for
  one; service tests update.
- **Hook**: `useAgents.ts` swaps the five flag updaters for
  `updateSkillProgress = makeFieldUpdater('skillProgress', { clamp: [0, 2] })`.
- **Card**: `AgentCard.tsx` Skills section becomes the P5X-style segmented row; summary chip logic
  changes; `agentBadges.ts` drops `ZZZ_COMBAT_SKILLS` / `ZzzSkillKey` / `ZzzSkillField`.
- **Page**: `ZzzPage.tsx` gains filter state, predicate composition, `describeHeld`, the filter
  row (accent `--color-zzz-rarity-s`), and the filter-specific `noMatchMessage`.
- **Shared components**: none changed. `ToggleChips` remains with no consumer.
- **Build score**: unchanged — skill progress stays display-only.
- **Docs**: CONTEXT.md ZZZ row wording if it mentions the five flags.
