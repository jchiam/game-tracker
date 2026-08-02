## 1. N2E cartridge editor

- [x] 1.1 In `src/pages/neverness-to-everness/components/CartridgeEditorModal.tsx`, remove the
      `excludeValues={currentMainStat ? [currentMainStat] : []}` prop from the `SubStatList` (omit
      it — sibling dedupe stays automatic; main stat becomes a selectable substat).
- [x] 1.2 In the Main Stat `Select` `onChange`, drop the substat prune: save
      `cartridgeSubStats: currentSubStats` unchanged (no `.filter((s) => s !== v)`).
- [x] 1.3 Correct the comment at lines ~60-62 — the substat gate is retained for user flow (pick a
      main before substats), NOT because a substat can't equal the main.

## 2. N2E cartridge scorer

- [x] 2.1 In `src/utils/cartridgeScoring.ts`, pass `[]` (not `c.cartridgeMainStat ? [c.cartridgeMainStat] : []`)
      as the excluded-stats argument to `achievableSubSum`, so the equipped main stat stays in the
      achievable substat pool.

## 3. Tests

- [x] 3.1 Update `CartridgeEditorModal.test.tsx`: assert the main stat IS offered as a substat
      option and IS NOT pruned when the main stat changes to a value present in the substats; keep
      the sibling-dedupe and main-gating assertions passing.
- [x] 3.2 Update `cartridgeScoring.test.ts`: assert the achievable substat pool includes the
      equipped main stat (main-as-sub is legal); confirm HSR/P5X-style exclusion tests are untouched.
- [x] 3.3 Run `npm test` — cartridge editor + scoring suites green; confirm HSR (`relicScoring.test.ts`,
      `RelicEditorModal.test.tsx`) and P5X suites unchanged and still passing.

## 4. Verify & finalize

- [x] 4.1 Run `npm run lint && npm run format:check`.
- [x] 4.2 Run `npx openspec validate --all`.
- [x] 4.3 Manually verify in the N2E cartridge editor: set main `Cycle Intensity`, confirm it is
      offerable and retainable as a substat, and the equipment-match score renders without error.
      Verified in live browser session.
