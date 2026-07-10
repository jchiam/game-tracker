## 1. Shared SubStatList

- [x] 1.1 In `src/components/SubStatList.tsx`, remove the `stat-value` branch, the `StatValueProps` / `SubStatValue` types, the value `<input>`, and the `placeholder` prop; collapse props to the single stat-only shape (the `variant` discriminant was removed entirely)
- [x] 1.2 Update `src/components/SubStatList.stories.tsx` — remove the `stat-value` story
- [x] 1.3 Update `src/components/SubStatList.test.tsx` — remove `stat-value` variant assertions

## 2. HSR relics

- [x] 2.1 In `src/data/honkai-star-rail/relics.ts`, remove the `RelicStat` interface; change `EquippedRelic.subStats` to `string[]`
- [x] 2.2 In `RelicEditorModal.tsx`, drop the `variant` prop on `SubStatList`; fix the conflict-prune filter (`sub !== mainStat`)
- [x] 2.3 In `CharacterCard.tsx` (HSR) — **no-op**: the card renders relic set icon + mainStat tooltip only; it never rendered substat values
- [x] 2.4 In `honkai-star-rail/characterService.ts`, drop `stat_value` from the `selectFragment` and the insert payload; map loaded substats to `string[]` of `stat_type`
- [x] 2.5 Update HSR tests (`RelicEditorModal.test.tsx`, `characterService.test.ts`, `relicScoring.test.ts`) removing `{ type, value }` fixtures; deleted the now-obsolete "substat value input" test
- [x] 2.6 **(added)** In `src/utils/relicScoring.ts`, read the substat type directly (`equippedSub`) instead of `equippedSub.type` — mechanical property-access fix, scoring logic unchanged

## 3. P5X revelations

- [x] 3.1 In `src/data/persona-5-phantom-x/revelations.ts`, remove the `RevelationStat` interface; change `EquippedRevelation.subStats` to `string[]`
- [x] 3.2 In `src/types.ts` — **no-op**: no P5X refs to `RevelationStat`; `revelationPreferences.subStats` is `StatPreference[]` (unchanged)
- [x] 3.3 In `RevelationEditorModal.tsx`, drop the `variant` prop; change `handleSubStatsChange` to `(subStats: string[])`; drop value map wrappers; fix main-stat prune filter (`s !== stat`)
- [x] 3.4 In `ThiefCard.tsx` — **no-op**: the card shows dominant Heavens/Space set only; it never rendered substat values
- [x] 3.5 In `persona-5-phantom-x/thiefService.ts`, change the `sub_stats` row type to `string[]` (load and save already pass through unchanged)
- [x] 3.6 Update P5X tests (`thiefService.test.ts`); `RevelationEditorModal.test.tsx` / `ThiefCard.test.tsx` / `useThieves.test.ts` needed no substat-value changes

## 4. DB migrations

- [x] 4.1 Add `supabase/migrations/20260710000004_hsr_drop_relic_substat_value.sql` — `ALTER TABLE hsr_relic_substats DROP COLUMN IF EXISTS stat_value;`
- [x] 4.2 Add `supabase/migrations/20260710000005_p5x_drop_revelation_substat_value.sql` — reshape `p5x_revelation_cards.sub_stats` JSONB from `[{type,value}]` to `["type", …]`, order-preserving via `jsonb_agg(elem->>'type' ORDER BY ord)`
- [x] 4.3 Reshape is idempotent — the `WHERE ... jsonb_typeof(e) = 'object'` guard skips rows already holding strings

## 5. Specs

- [x] 5.1 Apply `hsr-character-detail` delta (relic structure `subStats: string[]`)
- [x] 5.2 Apply `p5x-revelation-tracking` delta (state shape + `sub_stats` JSONB shape + reshape migration requirement)
- [x] 5.3 Apply `shared-ui-components` delta (`SubStatList` is stat-only, no variant)

## 6. Verify

- [x] 6.1 `npm test` — full suite green (964 passed)
- [x] 6.2 `npx openspec validate drop-substat-values --strict` — valid
- [x] 6.3 `npm run lint && npm run format:check` — clean
- [x] 6.4 `npm run build` — clean, no orphaned `RelicStat` / `RevelationStat` / `SubStatValue` references
