## Why

The Arknights: Endfield operator card was scaffolded in Phase 1 off the shared
roster template and tracks only level, potential, and favorite. Several of those
dimensions don't match how players actually invest in AE operators: rarity stars
take up card space without being an investment signal, "potential" is not the
mechanic players track for promotion, and the two biggest investment sinks —
ability maxing and the equipped weapon — aren't tracked at all. This change
reworks the per-operator tracked fields to mirror the patterns already proven in
HSR (traces) and R:1999 (psychube + portrait), so AE reaches feature parity with
the other games' cards.

## What Changes

- **Drop the rarity-star indicator from the card.** Rarity stays in the catalog
  (`AeOperator.rarity`, still available for sorting), but the `★` chip is removed
  from the operator card.
- **Rename `potential` → `phase`.** Repurpose the existing 0–5 dimension as
  "Phase" (0 = base, max 5), matching R:1999 portrait. The P0–P5 button row is
  relabeled; the DB column is renamed in place.
- **Add `skillsMaxed` (boolean).** A single "all skills maxed" flag, modeled on
  HSR's all-traces-attained toggle — no per-skill granularity.
- **Add equipped weapon tracking.** New `weaponName` (display name, nullable) +
  `weaponLevel` (1–90), modeled on R:1999 psychube. Weapons come from a new
  hand-authored `ALL_WEAPONS` catalog; the picker is filtered to weapons whose
  `type` matches the operator's `weapon` class.

## Capabilities

### New Capabilities

- `ae-weapon-catalog`: Static, hand-authored catalog of AE weapons
  (`ALL_WEAPONS`), with a `type` field that string-matches operator weapon
  classes to drive class-filtered equip pickers.

### Modified Capabilities

- `ae-operator-detail`: Replaces the `potential` field with `phase`, adds
  `skillsMaxed` and equipped-weapon fields, and updates the card collapsed-summary
  composition (phase + skills chips, a weapon gear one-liner, no rarity stars).

## Impact

- **New code**: `src/data/arknights-endfield/weapons.ts` (`ALL_WEAPONS`).
- **Modified code**: `src/types.ts` (`AeTrackedOperator`, `AeOperatorPatch`),
  `src/services/arknights-endfield/operatorService.ts` (column map, select,
  insert defaults), `src/hooks/arknights-endfield/useOperators.ts`
  (`updatePotential` → `updatePhase`, new `updateSkillsMaxed`, `updateWeapon`),
  `src/pages/arknights-endfield/components/OperatorCard.tsx` + `.css`.
- **DB migration**: new timestamped migration on `ae_tracked_operators` —
  `RENAME COLUMN potential TO phase` (data-preserving, but **reinterprets**
  existing `potential` values as `phase`), plus `ADD skills_maxed BOOLEAN`,
  `ADD weapon_name TEXT`, `ADD weapon_level INTEGER`.
- **Tests**: `OperatorCard.test.tsx` (drops the `.rarity-indicator` assertion,
  adds phase/skills/weapon coverage), `useOperators.test.ts`,
  `operatorService.test.ts`.
- **Weapons catalog is hand-authored**, same tech-debt class as
  `ae-operator-catalog` — no structured AE data source exists yet. The
  `add-ae-data-pipeline` change will eventually absorb both catalogs.
- **No new external image domain** — weapons are tracked by name + rarity only;
  no weapon icons in this change.
- **No breaking changes** to other games.
