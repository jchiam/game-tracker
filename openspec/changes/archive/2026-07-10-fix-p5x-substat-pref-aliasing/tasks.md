## 1. Fix aliasing in thiefService

- [x] 1.1 In `extras.mapRow` (`thiefService.ts`), add explicit `subStats: []` to the `prefs`
      literal so it no longer aliases `defaultRevelationPreferences.subStats`.
- [x] 1.2 In `fromRow` (`thiefService.ts`), replace `revelationPreferences: { ...defaultRevelationPreferences }`
      with a fresh structure that re-owns `mainStats` and `subStats` arrays (no aliasing of the module default).

## 2. Regression test

- [x] 2.1 Add a `thiefService.test.ts` case loading two thieves that both carry `sub_stats` rows;
      assert their loaded `revelationPreferences.subStats` are distinct references.
- [x] 2.2 Assert a second load of the same payload yields the same substat-row count (no doubling),
      and that mutating one thief's `subStats` does not affect the other.

## 3. Verify

- [x] 3.1 Run `npm test` (thiefService + useThieves suites green).
- [x] 3.2 Run `npm run lint && npm run format:check`.
- [x] 3.3 Run `npx openspec validate --all`.
