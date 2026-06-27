## 1. Add relic set one-liner to CharacterCard

- [x] 1.1 Used existing `availableRelicSets` prop (already passed to component) instead of importing `ALL_RELIC_SETS` directly.
- [x] 1.2 After the existing `relicCount` computation, add set-counting logic: reduce over 6 relic slots, accumulate `setId` → count in a Map, sort entries by count descending.
- [x] 1.3 Add a `.game-card-static-line` div after `.game-card-static-stats` in the summary. Render: set name + count spans separated by `·` (teal), or `—` with `.no-equip` (rust) when no relics equipped.

## 2. Update tests

- [x] 2.1 In `CharacterCard.test.tsx`, add a test with relics having `setId` values → assert set names and counts appear.
- [x] 2.2 Add a test with no relics equipped → assert dash placeholder renders.

## 3. Verify

- [x] 3.1 Run `npm test` — 897 passed across 63 files.
- [x] 3.2 Run `npm run lint && npm run format:check && npm run build` — clean.
