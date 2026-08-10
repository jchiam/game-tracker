## 1. Schema & Types

- [x] 1.1 Add migration `supabase/migrations/20260810000000_p5x_split_mindscape.sql`: add `mindscape_progress SMALLINT NOT NULL DEFAULT 0 CHECK (mindscape_progress BETWEEN 0 AND 2)` to `p5x_tracked_thieves`, backfill `2` where `mindscape_maxed` is `true`, drop `mindscape_maxed`
- [x] 1.2 In `src/types.ts`, replace `mindscapeMaxed` with `mindscapeProgress` on `P5xTrackedThief` and `P5xThiefPatch` (comment: 0 none, 1 Outer maxed, 2 Inner maxed = whole tree)

## 2. Service Layer (Mindscape)

- [x] 2.1 Update `thiefService.ts`: column map entry, insert default (`mindscape_progress: 0`), `select` string, and `fromRow` (`mindscapeProgress: row.mindscape_progress ?? 0`)
- [x] 2.2 Update `thiefService.test.ts` config-wiring assertions (column map, insert defaults, load mapping)

## 3. Hook Layer (Mindscape)

- [x] 3.1 In `useThieves.ts`, replace the `mindscapeMaxed` field updater with `updateMindscapeProgress` (plain `makeFieldUpdater`, clamped 0–2 like awareness) and export it
- [x] 3.2 Update `useThieves.test.ts`: cover the new updater (set 1, set 2, clamp out-of-range)

## 4. UI (Mindscape)

- [x] 4.1 In `ThiefCard.tsx`, replace `onToggleMindscapeMaxed` prop with `onUpdateMindscapeProgress`; replace the `ConfirmCheckbox` with a `SegmentedButtons` row (options "Outer"=1 / "Inner"=2, `coloring="investment"`, `allowDeselect` → 0) in the existing "Mindscape" `ProgressSection`; section value "Maxed" / "Outer" / "—"
- [x] 4.2 In `ThiefCard.tsx`, grade the summary chip: "MS ✓" at 2 (full-progress color), "MS O" at 1 (`getProgressStyle(1, 0, 2)`), no chip at 0
- [x] 4.3 Wire the handler in `P5xPage.tsx`
- [x] 4.4 Update `ThiefCard.test.tsx`: all three chip states, segmented selection → handler values (1, 2, deselect → 0), section value readout, fixture field rename
- [x] 4.5 Update `P5xPage.test.tsx` fixtures/wiring for the renamed field and handler

## 5. Verify (Mindscape)

- [x] 5.1 Sweep remaining `mindscapeMaxed` references (`RevelationEditorModal.test.tsx` fixtures, any others) and update
- [x] 5.2 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 5.3 Run `npx openspec validate --all`

## 6. Skills Convergence — Schema & Types

- [x] 6.1 Add migration `supabase/migrations/20260810000001_p5x_skill_progress.sql`: add `skill_progress SMALLINT NOT NULL DEFAULT 0 CHECK (skill_progress BETWEEN 0 AND 2)`, backfill `2` where `rose_maxed`, `1` where `skills_leveled AND NOT rose_maxed`, drop constraint `p5x_thief_skill_gate`, drop columns `skills_leveled` and `rose_maxed`
- [x] 6.2 In `src/types.ts`, replace `skillsLeveled` + `roseMaxed` with `skillProgress` on `P5xTrackedThief` and `P5xThiefPatch` (comment: 0 none, 1 Lv8 incense cap, 2 rose-maxed Lv10)

## 7. Skills Convergence — Service & Hook

- [x] 7.1 Update `thiefService.ts`: column map (`skillProgress` → `skill_progress`), insert default (`skill_progress: 0`), `select` string, `fromRow` (`skillProgress: row.skill_progress ?? 0`)
- [x] 7.2 Update `thiefService.test.ts` config-wiring assertions for the new column
- [x] 7.3 In `useThieves.ts`, delete the `updateSkillProgress` coupling body; re-export it as a plain `makeFieldUpdater('skillProgress', { clamp: [0, 2] })`
- [x] 7.4 Update `useThieves.test.ts`: replace coupling tests with progression tests (set 1, set 2, deselect 0, clamp)

## 8. Skills Convergence — UI

- [x] 8.1 In `ThiefCard.tsx`, change `onUpdateSkillProgress` prop to `(id, value: number) => void`; replace the two `ConfirmCheckbox`es with a `SegmentedButtons` row (options "Lv8"=1 / "Rose Lv10"=2, `coloring="investment"`, `allowDeselect` → 0, class `skills-row`); section value "Maxed" / "Rose-gated" / "—"; derive `roseGated` and the skills chip from `skillProgress` (`getProgressStyle(skillProgress, 0, 2)`)
- [x] 8.2 Remove the now-unused `.skill-toggles` rule from `ThiefCard.css` and the `ConfirmCheckbox` import from `ThiefCard.tsx` if no longer used
- [x] 8.3 In `P5xPage.tsx`, update wiring and the rose-gated filter predicate to `skillProgress === 1`
- [x] 8.4 Update `ThiefCard.test.tsx`: skills chip states from `skillProgress`, segmented selection → handler values, section value readout, fixture rename
- [x] 8.5 Update `P5xPage.test.tsx` fixtures/wiring and the rose-gated filter tests

## 9. Skills Convergence — Verify

- [x] 9.1 Sweep remaining `skillsLeveled` / `roseMaxed` references (`revelationScoring.test.ts`, `RevelationEditorModal.test.tsx`, any others) and update
- [x] 9.2 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run build`
- [x] 9.3 Run `npx openspec validate --all`
