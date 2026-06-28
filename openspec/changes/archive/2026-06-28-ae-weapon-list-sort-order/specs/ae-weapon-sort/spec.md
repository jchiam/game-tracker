## AE Weapon List Sort Order

### Convention

All user-facing weapon lists in the Arknights: Endfield module MUST be sorted:

1. **Rarity descending** (6★ → 5★ → 4★ → 3★)
2. **Name ascending** (alphabetical, locale-aware) within same rarity

This applies to:

- Weapon equip dropdowns
- Weapon preference pickers
- Any future UI that presents a list of weapons for user selection

### Sort Utility

A `sortWeaponsForDisplay` function accepts an `AeWeapon[]` and returns a new sorted
array. Located in `src/pages/arknights-endfield/components/weaponSort.ts` (colocated
with `weaponMatch.ts`).

```ts
import type { AeWeapon } from '@/data/arknights-endfield/weapons';

export function sortWeaponsForDisplay(weapons: AeWeapon[]): AeWeapon[] {
  return [...weapons].sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
}
```

### Static Catalog

`ALL_WEAPONS` in `src/data/arknights-endfield/weapons.ts` retains its current
editorial order (grouped by type, rarity ascending within type). The sort is
applied at display time only.

### Integration Points

| Consumer                                | How to apply                                               |
| --------------------------------------- | ---------------------------------------------------------- |
| `OperatorCard.tsx` — equip dropdown     | `sortWeaponsForDisplay(equippableWeapons)` before `.map()` |
| `OperatorCard.tsx` — preference options | Same sorted array feeds `weaponPrefOptions`                |
| Future weapon lists                     | Import and apply `sortWeaponsForDisplay`                   |
