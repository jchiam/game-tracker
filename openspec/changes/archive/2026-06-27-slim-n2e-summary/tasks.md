## 1. Restructure the collapsed summary

- [x] 1.1 In `CharacterCard.tsx`, replace the contents of `.game-card-static-summary` with only two child blocks: `.game-card-static-stats` (chips) and `.game-card-static-line` (one-liner). Remove the `.cartridge-slot-section` and `.cartridge-target-build` from the summary.
- [x] 1.2 Add a conditional third `StatChip` to `.game-card-static-stats`: label `Cart ${cartridgeScore.toFixed(0)}%`, colored by `getProgressStyle(cartridgeScore, 0, 100)`, rendered only when `hasCartridgePrefs && cartridgeScore >= 0`.
- [x] 1.3 Update the `.game-card-static-line` one-liner to show: arc name (teal when equipped) + `·` separator + cartridge name + rarity + ` Lv{level}` (teal) when cartridge is equipped. When neither is equipped, show `—` with `.no-equip`. When only arc is equipped, show arc name only. When only cartridge is equipped, show cartridge info only.

## 2. Move cartridge slot + Target Build into edit body

- [x] 2.1 Move the `.cartridge-slot-section` block (header + clickable slot) into `.game-card-edit-body-inner`, after the Arc `ProgressSection`. Keep all existing click handlers, classes, and styles unchanged.
- [x] 2.2 Move the `.cartridge-target-build` conditional block into `.game-card-edit-body-inner`, after the cartridge slot section. Keep markup, conditional rendering (`hasCartridgePrefs`), and styles unchanged.

## 3. Update height budget

- [x] 3.1 Change the inline `--game-card-summary-max-height` on the card root from `'400px'` to `'100px'`. Keep `--game-card-edit-max-height` at `'1200px'` (edit body is now larger).

## 4. Update tests

- [x] 4.1 Update `CharacterCard.test.tsx`: assert the collapsed summary renders `Lv`, `A n/6`, and conditional `Cart n%` chips. Assert the cartridge slot and Target Build are present in the edit body (still queryable by text in jsdom). For any test that clicks the cartridge slot or interacts with elements now in the edit body, open edit mode first (click the ✎ toggle).

## 5. Verify

- [x] 5.1 Run `npm test` — 895 passed across 63 files.
- [x] 5.2 Run `npm run lint && npm run format:check && npm run build` — clean.
- [x] 5.3 Run `npm run test:e2e` — passed (verified manually).
- [x] 5.4 Visual spot-check: collapsed height is uniform with and without cartridge prefs.
