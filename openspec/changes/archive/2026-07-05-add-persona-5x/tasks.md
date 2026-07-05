## 1. Foundation — types, tokens, migration

- [x] 1.1 Add `P5xThief` (incl. `codename`, `personaName`), `P5xTrackedThief`, `P5xThiefPatch`, `P5xParty`, `P5xPartyMember` interfaces to `src/types.ts` (level 1–80, awareness 0–6, party tier + favorite)
- [x] 1.2 Add `color.p5x` game tokens to `src/styles/design-tokens.json` and run `npm run build:tokens`
- [x] 1.3 Create migration `supabase/migrations/20260707000000_add_p5x_tables.sql`: `p5x_tracked_thieves` (unique `(profile_id, thief_id)`, level/awareness CHECKs), `p5x_parties` (tier + is_favorited), `p5x_party_members` (slot_index CHECK 0–3, `UNIQUE(party_id, slot_index)`), RLS policies + indexes per DB conventions
- [x] 1.4 Add P5X entry to CONTEXT.md domain glossary (game, Thief noun, Awareness, personaName)

## 2. Data pipeline

- [x] 2.1 Write `scripts/update-p5x-data.mjs` composing `scripts/lib/pipeline.mjs`, mirroring `update-hsr-data.mjs`: fetch Prydwen CloudFront list page-data (`/page-data/persona-5x/characters/page-data.json`), per-slug detail page-data (personaName + hashed image paths), map to `P5xThief` (slug as id, role/element verbatim), exit non-zero on fetch/parse failure without writing
- [x] 2.2 Image handling in the script: resolve portrait URL from each run's fresh JSON, download, `ensureAsset` upload to ImageKit `/persona-5-phantom-x/thieves/{slug}.webp`, `--reupload-*` flags, skipped/uploaded/failed summary; pick `_card` vs `_sm` source image during implementation
- [x] 2.3 Codegen: regenerate `src/data/persona-5-phantom-x/thieves.ts` with generated-file banner + catalog diff output (`diffByKey`/`formatDiff`)
- [x] 2.4 Run the script; verify 60 units land, all portraits resolve through ImageKit, diff output sane
- [x] 2.5 Add `.github/workflows/update-p5x-data.yml` — weekly cron + `workflow_dispatch`, auto-PR on catalog change, red run on script failure (mirror existing update workflows)

## 3. Service layer

- [x] 3.1 Create `src/services/persona-5-phantom-x/thiefService.ts` — `createRosterPersistence` config adapter (column map incl. level/awareness, insert defaults level 1 / awareness 0 / favorite false); re-export `loadThievesFromDB`, `insertThief`, `deleteThief`, `updateThief`
- [x] 3.2 Create `thiefService.test.ts` — config wiring only (load mapping, column map, insert defaults) per testing conventions
- [x] 3.3 Create `src/services/persona-5-phantom-x/partyService.ts` — `createPartyPersistence` config with tier + favorite; re-export `loadParties`, `saveParty`, `deleteParty`, `toggleFavoriteParty`
- [x] 3.4 Create `partyService.test.ts` — config wiring tests

## 4. Hook layer

- [x] 4.1 Create `src/hooks/persona-5-phantom-x/useThieves.ts` over the shared `useRoster` skeleton — field updaters via `makeFieldUpdater`/`applyPatch` (level clamp 1–80, awareness clamp 0–6, favorite), Fuse search keys name/codename/personaName/role/element
- [x] 4.2 Create `useThieves.test.ts` using the hoisted `vi.mock()` pattern (clamps, defaults, error paths)
- [x] 4.3 Create `src/hooks/persona-5-phantom-x/useParties.ts` party CRUD hook
- [x] 4.4 Create `useParties.test.ts`

## 5. Page + components

- [x] 5.1 Create `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` + `.css` composing `GameCardShell` — role/element `GameBadge`s, persona-name static line, `Lv`/`A{n}` `StatChip`s via `getProgressStyle`, `LevelSlider` (1–80), `SegmentedButtons` awareness row A0–A6 (`flex: 1`, no wrap), no rarity indicator
- [x] 5.2 Create `ThiefCard.test.tsx`
- [x] 5.3 Create `AddThiefModal.tsx` — config wrapper over `AddEntityModal` (title, Thief noun, Fuse `searchKeys`, `getBadges`) + `AddThiefModal.test.tsx`
- [x] 5.4 Create `PartiesTab.tsx` — `PartyViewConfig` adapter over shared `PartiesView` (nouns, image resolvers, slot accent, tier + favorite enabled) + `PartiesTab.test.tsx`
- [x] 5.5 Create `P5xPage.tsx` + `.css` — `useRosterView` config (sort modes alpha/level, placeholder, add title), `RosterPageLayout`, roster/lineups views + `P5xPage.test.tsx`

## 6. App wiring

- [x] 6.1 Add P5X entry to `GAMES` in `src/lib/games.ts` (id `p5x`, path `/persona-5-phantom-x`, icon, color, cover, `bg-p5x-sel`, lazy page)
- [x] 6.2 Add `.game-card-header.bg-p5x-sel` background to `src/index.css`; add selection cover + icon assets
- [x] 6.3 Update `shared-parties` spec expectations: confirm no CSP/env changes needed (`npm run verify:csp`)

## 7. Verification

- [x] 7.1 `npm run lint && npm run format:check && npm test && npm run build`
- [x] 7.2 `npm run test:e2e` — confirm existing suites unaffected; add P5X smoke path if suite structure has per-game specs
- [x] 7.3 Apply migration to Supabase and manually verify add/level/awareness/favorite/party flows end-to-end
- [x] 7.4 `npx openspec validate --all`
