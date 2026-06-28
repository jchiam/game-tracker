## Why

Weapon dropdowns in the AE operator card display weapons in catalog-insertion order
(rarity ascending, arbitrary within same rarity). Users scanning the list look for
high-rarity options first. A consistent sort — rarity descending, then alphabetical
ascending — matches that mental model and makes both the equip dropdown and the
preference picker easier to scan.

## What Changes

- Add a shared sort utility for AE weapon lists: sort by rarity descending, then
  name ascending (locale-aware). Lives alongside the weapon catalog or in a shared
  util so any future weapon list can reuse it.
- Apply the sort in `OperatorCard.tsx` where `equippableWeapons` is derived — this
  fixes both the weapon equip `<select>` and the `PreferenceChain` options.
- The static `ALL_WEAPONS` catalog order is **not** changed — sort is display-time only.
- "No Weapon" remains the first option in the equip dropdown (hardcoded above the map).

## Capabilities

### Modified Capabilities

- `ae-operator-card`: Weapon equip dropdown and preference picker now display weapons
  in rarity-descending, alpha-ascending order.

### New Capabilities

- `ae-weapon-sort-util`: Reusable sort function for AE weapon arrays. Convention:
  all user-facing weapon lists in the AE module use this sort.

## Impact

- **New code**: sort utility (small function, ~3 lines).
- **Modified code**: `src/pages/arknights-endfield/components/OperatorCard.tsx` (apply sort).
- **No DB/infra/migration changes.**
- **No changes to the static catalog file.**

## Non-goals

- Reordering the hand-maintained `ALL_WEAPONS` array in `weapons.ts`.
- Adding sort controls or user-configurable sort preferences.
- Applying this convention to other games' equipment lists (scoped to AE only).
