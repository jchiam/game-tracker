# Tasks — add-zzz-skill-gating

## 1. Schema

- [ ] 1.1 Write `supabase/migrations/20260910000000_zzz_skill_progress.sql`: add
      `skill_progress SMALLINT NOT NULL DEFAULT 0 CHECK (skill_progress BETWEEN 0 AND 2)` to
      `zzz_tracked_agents`; backfill `2` where all five `skill_*_maxed` are `true`, `0` otherwise;
      drop the five boolean columns — mirroring `20260810000001_p5x_skill_progress.sql`
- [ ] 1.2 Jonathan applies the migration to the live DB and confirms

## 2. Types

- [ ] 2.1 `src/types.ts`: on `ZzzTrackedAgent`, replace the five `skill*Maxed` booleans with
      `skillProgress: number` (comment: 0 not started, 1 skills at the Lv11 cap Pass-gated,
      2 Pass-maxed to Lv12); same swap on `ZzzAgentPatch`

## 3. Service

- [ ] 3.1 `agentService.ts`: column map gains `skillProgress: 'skill_progress'`, drops the five
      flag entries; select list and insert defaults (`skill_progress: 0`) updated; load mapping
      `skillProgress: row.skill_progress ?? 0`
- [ ] 3.2 `agentService.test.ts`: replace flag-mapping tests with skill-progress load/default/patch
      wiring tests

## 4. Hook

- [ ] 4.1 `useAgents.ts`: drop the five flag updaters; add
      `updateSkillProgress = makeFieldUpdater('skillProgress', { clamp: [0, 2] })`; add default
      `skillProgress: 0`; export swap
- [ ] 4.2 `useAgents.test.ts`: update updater and default-shape tests

## 5. Card

- [ ] 5.1 `agentBadges.ts`: remove `ZZZ_COMBAT_SKILLS`, `ZzzSkillKey`, `ZzzSkillField`
- [ ] 5.2 `AgentCard.tsx`: replace the `ToggleChips` skills row with the P5X-pattern
      `SegmentedButtons` milestone row (`SKILL_OPTIONS` "Lv11" / "Pass Lv12", investment coloring,
      `allowDeselect`) in the same section slot; section value "Maxed" / "Pass-gated" / em-dash;
      replace `onToggleSkillMaxed` prop with `onUpdateSkillProgress(id, value)`
- [ ] 5.3 `AgentCard.tsx`: replace the `Skl n/5` summary chip with the conditional indicator —
      "Skills ✓" at 2, "🐹 Gated" at 1, no chip at 0, styled from `getProgressStyle(value, 0, 2)`
- [ ] 5.4 `AgentCard.test.tsx`: update section, chip, and callback tests

## 6. Page

- [ ] 6.1 `ZzzPage.tsx`: add `passGateFilter` state; compose the predicate
      (`skillProgress === 1`) into the `filterRoster` wrapper; `describeHeld` returning
      `'no longer matches 🐹 Gated'`; pass `describeHeld` only while the gate is on
- [ ] 6.2 `ZzzPage.tsx`: render `filterRow` with the "🐹 Gated" chip, accent
      `--color-zzz-rarity-s`; filter-specific `noMatchMessage`
- [ ] 6.3 `ZzzPage.test.tsx`: filter chip narrows/restores, composes with search, empty state,
      held ghost-tag

## 7. Docs & verification

- [ ] 7.1 `CONTEXT.md`: update the ZZZ row if it names the five skill flags
- [ ] 7.2 `npm run lint && npm run format:check && npm test && npm run build` green
- [ ] 7.3 Manually exercise in `npm run dev`: milestone row selects/deselects, summary chip states,
      filter chip narrows and ghost-holds an edited card
