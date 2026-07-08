## 1. Schema

- [x] 1.1 Add migration `supabase/migrations/20260709000000_p5x_add_skill_tracking.sql`: `ALTER TABLE p5x_tracked_thieves ADD COLUMN skills_leveled BOOLEAN NOT NULL DEFAULT false`, `ADD COLUMN rose_maxed BOOLEAN NOT NULL DEFAULT false`, and `ADD CONSTRAINT p5x_thief_skill_gate CHECK (NOT (rose_maxed AND NOT skills_leveled))`

## 2. Types

- [x] 2.1 `src/types.ts`: add `skillsLeveled: boolean` and `roseMaxed: boolean` to `P5xTrackedThief`
- [x] 2.2 `src/types.ts`: add optional `skillsLeveled?` / `roseMaxed?` to `P5xThiefPatch`

## 3. Service

- [x] 3.1 `thiefService.ts`: extend `THIEF_COLUMNS` (`skillsLeveled → skills_leveled`, `roseMaxed → rose_maxed`), `select` (`..., skills_leveled, rose_maxed`), `insertDefaults` (`skills_leveled: false, rose_maxed: false`), and `fromRow` (`skillsLeveled: !!row.skills_leveled`, `roseMaxed: !!row.rose_maxed`)
- [x] 3.2 `thiefService.test.ts`: extend wiring tests — load mapping carries both bools, insert defaults include both, update maps both patch keys to columns

## 4. Hook

- [x] 4.1 `useThieves.ts`: extend `createTrackedThief` with `skillsLeveled: false, roseMaxed: false`
- [x] 4.2 `useThieves.ts`: add a state-reading `updateSkillProgress(id, patch)` updater (custom body, like N2E awakening) that normalizes the invariant — `roseMaxed → true` forces `skillsLeveled → true`; `skillsLeveled → false` forces `roseMaxed → false` — and queues both fields in one debounced patch; export it
- [ ] 4.3 (optional — DEFERRED) `useThieves.ts`: rose-gated roster filter/sort. Deferred to keep this change scoped to core skill tracking; fast follow-up.
- [x] 4.4 `useThieves.test.ts`: cover the updater invariant — enabling rose sets leveled; clearing leveled clears rose; the invalid combo is never emitted

## 5. Card UI

- [x] 5.1 `ThiefCard.tsx`: accept an `onUpdateSkillProgress` prop; render a "Skills" `ProgressSection` below the Awareness section with two coupled toggles (skills leveled / rose maxed). Uses `ConfirmCheckbox` (self-styled, matches AE `skillsMaxed` idiom) rather than raw `.toggle-btn`.
- [x] 5.2 `ThiefCard.tsx`: render the derived collapsed-summary indicator — 🌹 rose-gated chip when `skillsLeveled && !roseMaxed`, a "Skills ✓" chip when `roseMaxed`, nothing when untouched
- [x] 5.3 `ThiefCard.css`: `.skill-toggles` stack layout via design tokens. Rose-gated chip reuses the shared `StatChip` + `getProgressStyle` colour language, so no bespoke badge rule is needed.
- [x] 5.4 `ThiefCard.test.tsx`: chip shows only in rose-gated state; maxed state shows the maxed chip; untouched shows neither; toggles call `onUpdateSkillProgress`
- [x] 5.5 `P5xPage.tsx`: pass the hook's `updateSkillProgress` into `ThiefCard` as `onUpdateSkillProgress`

## 6. Spec & verification

- [x] 6.1 Author delta spec `specs/p5x-thief-detail/spec.md` (ADDED requirements) — done as part of this change
- [x] 6.2 Full gate: `npm test` (901 pass), `eslint` (clean), `prettier --check` (clean), `npm run build` (pass)
- [x] 6.3 `openspec validate p5x-skill-tracking` (valid)
