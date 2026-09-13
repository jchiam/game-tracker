## 1. Tracker Modality registry

- [x] 1.1 Create `src/lib/modalities.ts` — `TrackerModality` union, `Modality` interface, ordered `MODALITIES` (`roster` "Live-Service Rosters" / `collection` "Collections" with subtitles per design D1), and `gamesByModality()` returning populated groups in modality order; verify `npx tsc --noEmit`
- [x] 1.2 Add required `modality: TrackerModality` to `Game` in `src/lib/games.ts`; set `'roster'` on all six existing entries; verify `npx tsc --noEmit`
- [x] 1.3 Create `src/lib/modalities.test.ts` — unique ids, non-empty title/subtitle, `gamesByModality` order and empty-modality omission (use a stubbed `GAMES` via `vi.mock`); extend `src/lib/games.test.tsx` to assert every entry's `modality` exists in `MODALITIES`; verify `npx vitest run src/lib`

## 2. Home page sections

- [x] 2.1 `src/pages/SelectionPage.tsx`: hero copy → "Your Trackers" / "Pick something to track."; map `gamesByModality()` to `section.selection-section` with `.selection-section-header` (`h2.selection-section-title`, `p.selection-section-subtitle`) + existing `.selection-grid`; card markup unchanged; verify page renders in `npm run dev`
- [x] 2.2 `src/pages/SelectionPage.css`: `.selection-section` stacking gap `var(--spacing-2xl)`, header typography from tokens (no hardcoded values); grid rules untouched; verify `npm run lint`
- [x] 2.3 `src/pages/SelectionPage.test.tsx`: update hero-text assertions; add tests for two sections in order, one `h1` + one `h2` per section, cards under the correct section, click → `signInWithGoogle(path)` still holds; sweep `tests/` e2e for "Select Game" / "Choose a game" strings; verify `npx vitest run src/pages/SelectionPage`

## 3. Game switcher grouping

- [x] 3.1 `src/components/GameSwitcher.tsx`: render `.dropdown-group` + `.dropdown-group-label` per `gamesByModality()` group; header "Switch Tracker"; active/outside-click/`/`-hide logic unchanged; verify manually on a game route
- [x] 3.2 `src/components/GameSwitcher.css`: `.dropdown-group` and `.dropdown-group-label` (muted label, tokenised spacing/typography; enumerated transitions only); verify `npm run lint`
- [x] 3.3 `src/components/GameSwitcher.test.tsx`: assert every `.dropdown-item` sits inside a `.dropdown-group` whose label equals its modality title and groups follow `MODALITIES` order; update header-text assertions; update `GameSwitcher.stories.tsx` if it asserts copy; verify `npx vitest run src/components/GameSwitcher`

## 4. Second-view slot rename

- [x] 4.1 `src/components/RosterPageLayout.tsx`: rename `partiesTab` → `secondView` with the modality-neutral doc comment; update `RosterPageLayout.stories.tsx`; verify `npx tsc --noEmit` lists every stale call site
- [x] 4.2 Update the six game pages (`HsrPage`, `Reverse1999Page`, `N2ePage`, `ArknightsEndfieldPage`, `P5xPage`, `ZzzPage`) to pass `secondView`; verify `grep -rn "partiesTab=" src` returns nothing and `npx vitest run src/pages` passes

## 5. Digimon catalog and pipeline

- [x] 5.1 Create `scripts/seeds/dgm-devices.json` with the Phase-1 seed rows per design D6 (`id`, `name`, `line`, `series`, `releaseYear`, `region`, `colorway`, `imageSource`); verify `node -e "JSON.parse(require('fs').readFileSync('scripts/seeds/dgm-devices.json','utf8'))"`
- [x] 5.2 Create `scripts/update-dgm-data.mjs` composing `scripts/lib/pipeline.mjs`: seed validation (unique ids, required fields, region enum, four-digit year → non-zero exit naming the row), `ensureAsset` per entry to `/assets/digimon/devices/{id}.webp` with `--reupload-devices`, codegen of `src/data/digimon/devices.ts` (banner, `DgmDevice`, `ALL_DEVICES` in seed order, `DGM_LINES` first-appearance order); verify a dry run with ImageKit env unset generates the file and lists images as missing
- [x] 5.3 Run the script with ImageKit credentials to upload images and commit the generated `src/data/digimon/devices.ts`; verify `npm run format:check` passes on the generated file (use `jsStr()`-style quoting for Prettier stability)
- [x] 5.5 Replace the memory-authored seed with modern-era (2010+) rows transcribed from Wikimon device pages; each row carries `wikimon` (page title) and `imageSource: "wikimon:<File>"`; verify `node scripts/update-dgm-data.mjs` resolves every file and uploads it
- [x] 5.6 Add `--sync-wikimon` drift report to `scripts/update-dgm-data.mjs` (fetch referenced pages + `List of Virtual Pets`, parse infobox/gallery/versions, print differences, write nothing); verify a run prints "in sync" for fully covered pages and lists the unreferenced original-era pages
- [x] 5.7 Trim `color.dgm.line*` tokens, `DeviceCard.css` line badges, and the token story to the seven modern lines; verify `npm run build:tokens` and the DeviceCard tests
- [x] 5.4 Create `.github/workflows/update-dgm-data.yml` — `workflow_dispatch` only, same job shape and PR mechanics as `update-p5x-data.yml`; verify `npx openspec validate --all` and YAML lints in CI config

## 6. Digimon persistence and hook

- [x] 6.1 `src/types.ts`: add `DgmDeviceStatus`, `DgmDeviceCondition`, `DgmTrackedDevice`, `DgmDevicePatch` per design D5; verify `npx tsc --noEmit`
- [x] 6.2 Create `supabase/migrations/20260912000000_add_dgm_tables.sql` — `dgm_tracked_devices` with the D5 columns, CHECK constraints, `UNIQUE (profile_id, device_id)`, `profile_id` index, RLS enabled with the cached-`auth.uid()` user-scoped policy form; verify by applying the full migration history to a throwaway `postgres:16` container (see the RPC verification harness memory)
- [x] 6.3 Create `src/services/digimon/deviceService.ts` — `createRosterPersistence` adapter (table, `device_id`, column map, insert defaults, select string, `fromRow` mapping `acquired_on` → ISO string or null); export `loadDevicesFromDB` / `insertDevice` / `deleteDevice` / `updateDevice`; verify `npx tsc --noEmit`
- [x] 6.4 Create `src/services/digimon/deviceService.test.ts` — config wiring only: load mapping, column map, insert defaults (shared `createBuilder` mock); verify `npx vitest run src/services/digimon`
- [x] 6.5 Create `src/hooks/digimon/useDevices.ts` — `useRoster` wrapper, `createTrackedDevice` defaults, five `makeFieldUpdater` updaters, `getFilteredRoster` with `YEAR` comparator; verify `npx tsc --noEmit`
- [x] 6.6 Create `src/hooks/digimon/useDevices.test.ts` (hoisted-mock pattern) — add defaults, each updater writes its field, `YEAR` sort order, load error path; verify `npx vitest run src/hooks/digimon`

## 7. Digimon UI

- [x] 7.1 `src/styles/design-tokens.json`: add `color.dgm` (`selStart`, `selMid`, line and region badge hues); run `npm run build:tokens`; add the group to `DesignTokens.stories.tsx`; verify `npm run build:storybook`
- [x] 7.2 `src/index.css`: add `.selection-card-header.bg-dgm-sel` gradient in the existing pattern (+ image-fit override if the cover needs it); `src/lib/imagekit.ts`: add `getDeviceImageUrl` (contain-fit product transform); verify `npm run lint`
- [x] 7.3 Add self-hosted `public/assets/icons/dgm-icon.webp` and `public/assets/digimon/selection-cover.webp` (no hotlinking); verify they render on the home page
- [x] 7.4 Create `src/pages/digimon/components/DeviceCard.tsx` + `.css` per design D7 — `GameCardShell` slots, `GameBadge` line/region variants (`dgm-line-*`, `dgm-region-*` classes tokenised in the css), `StatChip`s, `SegmentedButtons` status / condition (`allowDeselect`), `FormGroup` + native date input, `BuildComments` notes; verify visually in `npm run dev`
- [x] 7.5 Create `src/pages/digimon/components/DeviceCard.test.tsx` — status click, condition deselect → `null`, date set/clear, notes, favorite, remove, `onEditCommit`; verify `npx vitest run src/pages/digimon/components/DeviceCard`
- [x] 7.6 Create `src/pages/digimon/components/AddDeviceModal.tsx` + `.test.tsx` — `AddEntityModal` config wrapper (title, noun, `searchKeys`, badges), config-wiring test; verify `npx vitest run src/pages/digimon/components/AddDeviceModal`
- [x] 7.7 Create `src/pages/digimon/components/CompletionView.tsx` + `.css` + `.test.tsx` per design D8 — overall + per-`DGM_LINES` rows, owned-only counting, integer percentage, `.completion-bar-fill` width, shared progress gradient tokens, load ladder (`LoadingState` / `ErrorState` / `AuthGate`); tests for the three counting scenarios and the error/signed-out rungs; verify `npx vitest run src/pages/digimon/components/CompletionView`
- [x] 7.8 Create `src/pages/digimon/DigimonPage.tsx` + `.css` + `.test.tsx` — `useDevices` + `useRosterView` (ALPHA/YEAR, placeholder, add title) + `RosterPageLayout` (title, "Completion" second view, empty/no-match copy), `refreshBasis` on favorite and edit commit, `AddDeviceModal` in children; page test covers the render ladder, tab switch to Completion, add-modal open; verify `npx vitest run src/pages/digimon`
- [x] 7.9 `src/lib/games.ts`: add the `dgm` entry (`modality: 'collection'`, path `/digimon`, lazy `DigimonPage`); verify `/digimon` loads in `npm run dev` and appears in the Collections section and switcher group

## 8. Docs and verification

- [x] 8.1 `CONTEXT.md`: add the **Tracker Modality** section under Core Concepts (modality, roster vs collection, the collection as the roster of a collection-modality tracker, Completion as its second view), add the Digimon row to The Games (short id `dgm`, directory `digimon`, noun **device**), note in Party View that collection-modality trackers have no parties
- [x] 8.2 `CLAUDE.md`: add Digimon to the tracked list, add the `modality` field to wiring step 2, note `secondView` on `RosterPageLayout`, add `dgm` to the commit-scope list; verify `npx openspec validate --all`
- [x] 8.3 Run `npm run lint && npm run format:check && npm test && npm run build`; fix anything reported; verify all green before marking complete
