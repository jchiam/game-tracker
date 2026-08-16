# Tasks — add-zzz-wengines

## 1. Data pipeline & catalog

- [x] 1.1 Add W-Engine section to `scripts/update-zzz-data.mjs`: fetch `weapons.json`, loc-resolve names, map `{ id, name, rarity, specialty, imageUrl }`, `loadExistingWEngines()` re-parse for diffing, `generateWEnginesTs()` with `jsStr` emit + generated banner, per-engine `ensureAsset` upload to `zenless_zone_zero/wengines/{id}.png`, `parseReuploadFlags(['agents', 'discs', 'wengines'])`, engine diff output. Agent/suit paths untouched.
- [x] 1.2 Run the script live to generate `src/data/zenless-zone-zero/wengines.ts` (sorted rarity desc then name) and upload icons; verify idempotent rerun (0 uploads).
- [x] 1.3 Add `getZzzWEngineIconUrl` (`tr:w-128`, local fallback) to `src/lib/imagekit.ts` + tests.

## 2. Types, DB, service

- [x] 2.1 Migration `supabase/migrations/20260818000000_add_zzz_wengine_columns.sql`: ALTER `zzz_tracked_agents` ADD `wengine_id TEXT`, `wengine_level INTEGER NOT NULL DEFAULT 0`, `wengine_phase INTEGER NOT NULL DEFAULT 1`, `wengine_preferences TEXT[] NOT NULL DEFAULT '{}'`.
- [x] 2.2 `src/types.ts`: extend `ZzzTrackedAgent` with `wEngineId: string | null`, `wEngineLevel: number`, `wEnginePhase: number`, `wEnginePreferences: string[]`; extend `ZzzAgentPatch` with the optional forms.
- [x] 2.3 `agentService.ts`: column map, insert defaults, select fragment, `fromRow` mapping for the four new columns. Service tests for the wiring.

## 3. Hook

- [x] 3.1 `useAgents.ts`: seed new fields in `createTrackedAgent`; add `makeFieldUpdater`-declared updaters `updateWEngine(id, wEngineId)`, `updateWEngineLevel` (clamp 0–60), `updateWEnginePhase` (clamp 1–5), `updateWEnginePreferences(id, string[])`. Hook tests (clamps, patch queue, preference array write).

## 4. Score blend

- [x] 4.1 New `src/utils/zzzBuildScore.ts`: `calculateZzzBuildScore` per zzz-build-scoring spec (0.25/0.75 blend, rank decay 0.25 step / 0.25 floor, active-side renormalization, −1 sentinel); re-export `getScoreGrade`.
- [x] 4.2 `zzzBuildScore.test.ts`: both-active blend, don't-care pass-through, engine-alone, both-inactive −1, rank decay + floor, off-build 0, level/Phase invariance.
- [x] 4.3 `ZzzPage.tsx`: swap SCORE sort + `ScoreBadge` source from `calculateDiscScore` to `calculateZzzBuildScore`. Page tests updated.

## 5. Card & modal UI

- [x] 5.1 `WEngineEditorModal.tsx` (+ CSS): `Modal` + `PreferenceChain` `variant="ranked-list"`, specialty-filtered options labelled `Name (S/A/B)`, `bodyClassName="modal-body wengine-editor-body"`, Done footer. Component tests.
- [x] 5.2 `AgentCard.tsx`: W-Engine summary line (name/level/Phase gradient colouring + `#N`/`Off-build` match badge); edit-body W-Engine `.card-section-group` with specialty-filtered `Select`, `LevelSlider` 0–60, `SegmentedButtons` P1–P5, and the preference strip (icon tiles, rank badges, equipped highlight, `+N` overflow, tap-caption, display-only) with header button opening the modal. New props wired. CSS via canonical classes + game overrides only.
- [x] 5.3 `AgentCard.test.tsx`: summary line, match badge states, strip render/overflow/caption/display-only, control callbacks.
- [x] 5.4 `ZzzPage.tsx`: mount `WEngineEditorModal` state + hook wiring; fixtures in page/AddAgentModal tests gain the new fields.

## 6. Verification

- [x] 6.1 `npx openspec validate --all`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`.
- [ ] 6.2 Apply migration to live Supabase (Jonathan) and manual verification.
