## Why

Every P5X thief has the lowest-tier (2★) weapon equipped for free from day one — a thief is never truly weaponless. But the tracker models `weaponRarity` as **nullable** (default `null`, clearable via `allowDeselect`), where `null` means "weapon investment not yet tracked". That `null` is a contradiction with the game: it renders as "—" / a hidden weapon chip, implying no weapon when one always exists. It also complicates any weapon-rarity logic (e.g. a "weak weapon" filter) with a null guard.

## What Changes

- **BREAKING (data model):** `weaponRarity` becomes a **non-null** integer in `{2,3,4,5}`, defaulting to **`2`** (lowest tier) on add. It can no longer be `null`.
- Remove `allowDeselect` from the weapon-rarity `SegmentedButtons` — rarity can never be cleared.
- The weapon summary chip is **always** rendered (no more null-hidden state); the edit-section value label never shows "—".
- **DB:** backfill existing `weapon_rarity IS NULL` rows to `2`, then `ALTER COLUMN … SET DEFAULT 2, SET NOT NULL`.
- `P5xTrackedThief.weaponRarity` type narrows from `number | null` to `number`, removing the now-dead null guards across `ThiefCard` and the service mapper.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-thief-detail`: the *Weapon rarity field*, *Weapon summary chip*, and *Weapon edit section* requirements change — rarity is non-null with default `2`, not clearable, and the chip/value-label always reflect a present weapon.

## Impact

- **Code:** `src/hooks/persona-5-phantom-x/useThieves.ts` (`createTrackedThief` default `2`), `src/services/persona-5-phantom-x/thiefService.ts` (insert default + row mapper), `src/types.ts` (`weaponRarity: number`), `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` (drop `allowDeselect` + null guards; `onUpdateWeaponRarity` signature `number | null → number`).
- **DB:** one forward-only migration — backfill + `SET DEFAULT 2` + `SET NOT NULL` on `p5x_tracked_thieves.weapon_rarity`.
- **Tests:** `ThiefCard`, `useThieves`, `thiefService` — drop null-weapon cases, assert default `2` and always-present chip.
- **Backwards compatibility:** the backfill is a one-way data mutation — every previously-untracked (`null`) weapon becomes a real `2★`. Accepted: under the game's day-one rule, `null` always meant an unacknowledged 2★.
- **Depended on by:** the `p5x-weak-weapon-filter` change (its `weaponRarity < 5` predicate assumes non-null).
