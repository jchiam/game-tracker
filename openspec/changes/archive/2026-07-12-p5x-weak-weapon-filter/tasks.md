> **Prerequisite:** `p5x-require-weapon-rarity` must be applied and archived first
> (makes `weaponRarity` non-null, so the predicate is a bare `weaponRarity < 5`).

## 1. Filter state + predicate

- [x] 1.1 In `P5xPage.tsx` add `const [weaponFilter, setWeaponFilter] = useState(false)`
- [x] 1.2 In `filteredGetRoster`, compose the active chips into one predicate: `(t) => (!roseGateFilter || (t.skillsLeveled && !t.roseMaxed)) && (!weaponFilter || t.weaponRarity < 5)`; pass `undefined` when neither filter is active (preserve the fast path); add `weaponFilter` to the `useCallback` deps

## 2. Chip UI

- [x] 2.1 Add a second `filter-chip` button `⚔ <5★` in the existing `.filter-row`, toggling `weaponFilter`, with an appropriate `title` (active/inactive)

## 3. Empty state

- [x] 3.1 Extend `noMatchMessage` to cover the weapon filter (e.g. "No thieves with a sub-5★ weapon.") and the combined case, keeping the existing rose-gate branch

## 4. Tests

- [x] 4.1 `P5xPage.test.tsx`: `⚔ <5★` chip is visible in the toolbar
- [x] 4.2 Activating it narrows the roster to `weaponRarity < 5`
- [x] 4.3 Both chips active compose as AND (rose-gated AND weak-weapon)

## 5. Verify

- [x] 5.1 `npx openspec validate --all`
- [x] 5.2 `npm run lint && npm run format:check && npm test && npm run build`
