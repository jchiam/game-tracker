## Why

The ZZZ Core Skill rung control is wrong in two ways. Its letter mapping is inverted — the
implementation treats `A` as the maximum rung, but in-game the Core Skill enhancement track runs
`A → B → C → D → E → F` with `A` as the first (cheapest) purchase and `F` as the max, so every
tracked agent currently displays the exact opposite of the player's real progress. Separately, the
control renders as a single-exact pill row, which reads as six independent grades; Core Skill is a
cumulative ladder where owning `C` means `A` and `B` were bought first, and neither the resting
state nor the hover state communicates that prerequisite chain.

The ZZZ skills screen also carries five leveled combat skills (Basic Attack, Dodge, Assist, Special
Attack, Chain Attack) that the tracker records nowhere, so an agent card cannot answer the one
question the player actually farms toward: which skill tracks are finished.

## What Changes

- **BREAKING (display only)**: The Core Skill letter mapping is corrected to `1 → A … 6 → F`,
  reversing the current `1 → F … 6 → A`. The stored integer semantics are unchanged (`0` = no
  enhancement, `6` = max), so no data migration or backfill is required — existing rows keep their
  meaning and simply render the correct letter.
- Core Skill rung `0` is redescribed as **unenhanced** rather than "locked": the Core Passive is
  active from the moment the agent is obtained; rung `0` means no enhancement purchased.
- `SegmentedButtons` gains an opt-in cumulative fill mode: every rung up to and including the
  selected one renders filled, each taking its own position on the shared investment gradient so the
  row reads as a continuous ramp instead of one lit pill.
- Cumulative rows gain prerequisite-aware hover and keyboard-focus feedback. Pointing at a rung
  never highlights that rung alone — it always previews the full range from the first rung, showing
  either the rungs that would be added (upgrade) or the rungs that would be given up (downgrade).
- Pill rows expose `aria-pressed` per button so assistive technology reports the whole filled run
  rather than a single selection.
- A new shared `ToggleChips` primitive covers multi-independent-boolean pill rows, which
  `SegmentedButtons` explicitly does not model.
- ZZZ tracked agents gain five booleans recording whether each combat skill is maxed at base
  Lv. 12: Basic Attack, Dodge, Assist, Special Attack, Chain Attack. Levels themselves are not
  tracked — only the finished/unfinished state of each track.
- The agent card gains a "Skills at Lv12" row rendering those five flags, and a single collapsed
  summary chip showing the maxed count.
- The shared progress-gradient utility gains a reduced-strength preview variant of its style set so
  the hover preview reuses the one ramp rather than mixing its own alphas.

## Capabilities

### New Capabilities

None. Every change extends an existing capability.

### Modified Capabilities

- `zzz-agent-detail`: Core Skill letter ordering reversed to A→F and rung `0` redefined as
  unenhanced; the Core Skill edit control becomes a cumulative ladder; five new per-skill
  maxed-at-Lv12 boolean fields with their card row and collapsed summary chip.
- `shared-ui-components`: `SegmentedButtons` gains a cumulative fill mode, prerequisite-aware
  hover/focus range preview, and `aria-pressed`; a new `ToggleChips` component requirement covers
  multi-independent-boolean pill rows.
- `shared-card-controls`: `.toggle-btn` gains canonical cumulative-rung state treatments, and the
  base per-button hover rule is scoped so it does not apply to cumulative rows.
- `shared-progress-gradient`: the utility gains a preview variant of its style set at reduced
  strength, derived from the same interpolated hue.

## Impact

- **Schema**: one new migration adding five `BOOLEAN NOT NULL DEFAULT false` columns to
  `zzz_tracked_agents`. Additive only; no backfill, no data loss, existing rows default to
  unfinished.
- **Types**: `ZzzTrackedAgent` and `ZzzAgentPatch` gain the five skill-maxed keys.
- **Service**: `agentService.ts` column map, select list, and insert defaults extend by five fields.
- **Hook**: `useAgents.ts` gains five `makeFieldUpdater` declarations.
- **Shared components**: `SegmentedButtons.tsx` (new mode + hover/focus state + ARIA), new
  `ToggleChips.tsx` + story, `progressGradient.ts` (preview helper), `controls.css` (rung state
  rules, hover scoping).
- **ZZZ card**: `agentBadges.ts` letter array, `AgentCard.tsx` Core Skill section + new skills row +
  summary chip, `AgentCard.css` if any row override is needed.
- **Docs**: `CONTEXT.md` ZZZ row currently reads "Core Skill (F→A rungs)" and must be corrected.
- **Other games**: none. The cumulative mode and `aria-pressed` are opt-in and additive; the eight
  existing `SegmentedButtons` call sites keep single-exact behaviour.
- **Build score**: unchanged. Core Skill and the skill flags stay display-only, so no existing score
  is re-weighted.
