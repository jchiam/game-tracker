# Tasks: add-hsr-light-cone-preferences

## 1. Schema & Types

- [x] 1.1 Add migration `supabase/migrations/20260812000000_add_hsr_light_cone_preferences.sql`: `light_cone_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]` on `hsr_tracked_characters`, with a header comment documenting ordered-ids semantics (index 0 = first choice) and the atomic array-column rationale (AE weapon-preference precedent)
- [x] 1.2 `src/types.ts`: add top-level `lightConePreferences: string[]` to `HsrTrackedCharacter` and optional to `HsrCharacterPatch`; `buildPreferences` untouched

## 2. Service Layer

- [x] 2.1 `characterService.ts`: map `lightConePreferences` in `CHARACTER_COLUMNS`, add `light_cone_preferences` to the select fragment, map `row.light_cone_preferences ?? []` top-level in `fromRow`; `saveBuildPrefs` untouched
- [x] 2.2 `characterService.test.ts`: cover load mapping (populated array, null column → `[]`) and the patch column mapping in `updateCharacter`

## 3. Hook Layer

- [x] 3.1 `useCharacters.ts`: declare `updateLightConePreferences = makeFieldUpdater('lightConePreferences')` and expose it; add `lightConePreferences: []` to `createTrackedCharacter`
- [x] 3.2 `useCharacters.test.ts`: field updater round-trips the ordered array (optimistic set + queued patch)

## 4. Preference Dialog

- [x] 4.1 New `LightConeEditorModal.tsx`: base `Modal` titled for the character, one `PreferenceChain variant="ranked-list"` — options `ALL_LIGHT_CONES.filter(lc => lc.path === char.path)` labelled `${name} (${rarity}★)`, `addLabel="+ Add Light Cone"`, onChange calls `onUpdatePreferences` with the ordered id array
- [x] 4.2 `LightConeEditorModal.test.tsx`: renders ranked list, options path-filtered, add/reorder/remove propagate the ordered array, close works
- [x] 4.3 `HsrPage.tsx`: `editingLightConePrefs` state (charId) following the `editingRelic` pattern; render the dialog with the live character and `updateLightConePreferences`
- [x] 4.4 `RelicEditorModal`: verify untouched (no Light Cone controls)

## 5. Card — Clustering, Launcher, Badge

- [x] 5.1 `CharacterCard.tsx`: cluster the edit body per spec — "Light Cone" `.card-section-group` (ProgressSection "Equipped" with existing cone controls, ProgressSection "Preferences" with the dialog launcher button) and "Relics" group (slot grid + Target Build readout); Level/Traces stay ungrouped above
- [x] 5.2 `CharacterCard.tsx`: `#N` / `Off-build` match badge on the cone summary line via `indexOf` + `getProgressStyle`, guard `prefs.length > 0 && lightConeId !== null`
- [x] 5.3 `CharacterCard.css`: `.cone-match-badge` rule following the AE `weapon-match-badge` shape (token values only)
- [x] 5.4 `CharacterCard.test.tsx`: group structure (Light Cone group contains Equipped + Preferences, Relics group contains grid + readout, Level/Traces outside), launcher fires the open callback, badge states (`#1`, `#k+1`, `Off-build`, absent without prereqs)

## 6. Verify

- [x] 6.1 `npx openspec validate --all` passes
- [x] 6.2 `npm run lint && npm run format:check && npm test && npm run build` pass
- [x] 6.3 Manual pass in dev: rank a few cones from the card dialog, reload, confirm persistence and badge states (requires migration applied to the Supabase project)
