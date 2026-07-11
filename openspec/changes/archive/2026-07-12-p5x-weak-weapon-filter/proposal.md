## Why

When gearing a P5X roster, the actionable question is "which thieves are still on a sub-5★ weapon?" Today the only way to see that is to scan every card. The roster toolbar already has the filter-chip machinery (the `🌹 Gated` rose filter), so a weapon filter is a small, well-patterned addition.

## What Changes

- Add a `⚔ <5★` filter chip to the P5X roster toolbar that, when active, narrows the roster to thieves whose equipped weapon is below 5★ (`weaponRarity < 5`, i.e. 2/3/4).
- The chip composes with search, sort, and the existing rose-gate filter. When both filter chips are active they combine as a **logical AND** (rose-gated **and** weak-weapon).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-thief-detail`: adds a _P5X weapon-rarity roster filter_ requirement (a sibling of the existing _Rose-gated roster filter_), plus the AND-composition behaviour when both P5X filter chips are active.

## Impact

- **Code:** `src/pages/persona-5-phantom-x/P5xPage.tsx` only — add `weaponFilter` state, the `⚔ <5★` chip in the existing `filterRow`, compose `(rose && weapon)` into the single predicate passed to `getFilteredRoster`, and extend the `noMatchMessage` branch. No hook/service/DB change (`getFilteredRoster` already accepts a predicate).
- **Tests:** `P5xPage.test.tsx` — chip visible, activating narrows to `weaponRarity < 5`, AND-composition with the rose chip.
- **Depends on:** `p5x-require-weapon-rarity` **must be applied and archived first**. That change makes `weaponRarity` non-null, so the predicate is a bare `weaponRarity < 5`. Before it, `weaponRarity` can be `null`, and in JS `null < 5` is `true` — an untracked thief would spuriously match. Do not implement this change until `p5x-require-weapon-rarity` has landed.
