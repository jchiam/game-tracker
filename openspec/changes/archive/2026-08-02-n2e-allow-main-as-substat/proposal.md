## Why

The N2E (Neverness to Everness) cartridge editor and scorer enforce a hoyoverse-style rule
that **a substat may never equal the equipped main stat**. That rule is real for HSR relics
(a relic's main stat is excluded from its own sub-roll pool) but is **wrong for N2E**: in the
actual game a cartridge's main and sub stats roll independently, so the same stat legitimately
appears as both main and sub on a single cartridge (e.g. `Cycle Intensity` main + `Cycle
Intensity` sub, or `ATK%` on both). The tracker currently forbids builds the game allows.

## What Changes

- **N2E cartridge editor** stops excluding the equipped main stat from the substat option list
  and stops pruning a colliding substat when the main stat changes — the main stat becomes a
  legal substat choice.
- **N2E cartridge scorer** stops removing the equipped main stat from the achievable substat
  pool, so a perfect legal N2E item's achievable sum reflects that main-as-sub is allowed.
- **Unchanged, deliberately**: substat rows still dedupe against each other (sub == sub stays
  illegal); the substat list stays gated behind main-stat selection for consistent user flow;
  HSR and P5X keep the exclusion (their game rule genuinely forbids main == sub).

No breaking change to stored data — existing collisions were already persisted and now become
first-class legal builds rather than pruned artifacts.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-ui-components`: the "Equipment editors share labeled, set-gated stat controls"
  requirement's **substats-exclude-main** invariant no longer applies to the N2E cartridge
  editor. The exclusion/prune rule is narrowed to HSR and P5X only; N2E is explicitly carved out
  (main stat is offered and kept as a substat). The main-gating and labeled-control rules for
  N2E are unchanged.

## Impact

- `src/pages/neverness-to-everness/components/CartridgeEditorModal.tsx` — drop `excludeValues`
  (main), drop prune-on-main-change, correct the sub-gating comment.
- `src/utils/cartridgeScoring.ts` — pass `[]` (not the equipped main) as the excluded stats to
  `achievableSubSum`.
- Tests: `CartridgeEditorModal.test.tsx` (exclusion/prune assertions flip), `cartridgeScoring.test.ts`
  (achievable pool now includes the main stat).
- No change to HSR (`relicScoring.ts`, `RelicEditorModal.tsx`), P5X, `SubStatList`, or the
  game-agnostic scoring core (`achievableSubSum` still excludes exactly what it is passed).
