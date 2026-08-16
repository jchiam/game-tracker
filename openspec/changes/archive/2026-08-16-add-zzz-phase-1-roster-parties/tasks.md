## 1. Data pipeline

- [x] 1.1 Write `scripts/update-zzz-data.mjs` composing `scripts/lib/pipeline.mjs`: fetch Enka store `avatars.json` + `locs.json`, resolve English names, drop beta/name-unresolvable entries, emit generated `src/data/zenless-zone-zero/agents.ts` (`ZzzAgent`, `ALL_ZZZ_AGENTS`, generated-file banner, catalog diff output)
- [x] 1.2 Portrait seeding in the script: download each agent `Image` from the Enka CDN, upload via `ensureAsset` to ImageKit folder `zenless_zone_zero/agents`, `--reupload-agents`/`--reupload-all` flags, counters + missing list from `ensureAsset` results
- [x] 1.3 Run the script for real; commit the generated `agents.ts`; spot-check portraits resolve through `getMugshotUrl`/`getAvatarUrl`
- [x] 1.4 Add `.github/workflows/update-zzz-data.yml` (weekly cron + manual dispatch, auto-PR on diff) mirroring the HSR workflow

## 2. Types + database

- [x] 2.1 Add `ZzzAgent`, `ZzzTrackedAgent` (level, mindscape, coreSkill, isFavorited), `ZzzParty`, `ZzzPartyMember` to `src/types.ts`
- [x] 2.2 Migration `supabase/migrations/<ts>_add_zzz_tables.sql`: `zzz_tracked_agents` (UNIQUE(profile_id, agent_id), CHECKs level 1–60 / mindscape 0–6 / core_skill 0–6), `zzz_parties` (tier, is_favorited), `zzz_party_members` (slot_index CHECK 0–2, UNIQUE(party_id, slot_index)); RLS + user-scoped policies + standard indexes on all three

## 3. Service + hook layers

- [x] 3.1 `src/services/zenless-zone-zero/agentService.ts` as `createRosterPersistence` config adapter (column map, insert defaults, catalog merge) + `agentService.test.ts` (config wiring only)
- [x] 3.2 `src/services/zenless-zone-zero/partyService.ts` via `createPartyPersistence` (3-slot member replacement, tier, `toggleFavoriteParty`) + `partyService.test.ts`
- [x] 3.3 `src/hooks/zenless-zone-zero/useAgents.ts` over `useRoster` skeleton — field updaters via `makeFieldUpdater` (level clamp 1–60, mindscape, coreSkill, favorite), Fuse keys name/specialty/element + `useAgents.test.ts` (hoisted-mock pattern)
- [x] 3.4 `src/hooks/zenless-zone-zero/useParties.ts` + `useParties.test.ts`

## 4. Page + components

- [x] 4.1 Design tokens: `color.zzz` in `design-tokens.json` (+ `npm run build:tokens`); `.game-card-header.bg-zzz-sel` in `index.css`
- [x] 4.2 Element/specialty presentation maps (display labels: Elec→Electric, Physics→Physical, FireFrost→Frost, AuricEther→Auric Ink, …; badge classes with neutral fallback) in the ZZZ page module
- [x] 4.3 `AgentCard.tsx` composed from `GameCardShell`: S/A rarity indicator, specialty + element `GameBadge`s, collapsed summary (level, M-rank, Core Skill letter), edit sections Level (`LevelSlider`) → Mindscape (`SegmentedButtons` M0–M6) → Core Skill (`SegmentedButtons` F→A) + `AgentCard.css` (overrides only) + `AgentCard.test.tsx`
- [x] 4.4 `AddAgentModal.tsx` as `AddEntityModal` config wrapper (search keys, rarity/specialty/element badges) + test
- [x] 4.5 `PartiesTab.tsx` as `PartiesView` config adapter with three uniform unfiltered `slots` (indices 0–2) + config-wiring test asserting 3 slots render and slot accent class
- [x] 4.6 `ZzzPage.tsx` via `useRosterView` + `RosterPageLayout` (sort modes alphabetical/level, add modal, parties view) + `ZzzPage.css` + `ZzzPage.test.tsx`
- [x] 4.7 Register in `src/lib/games.ts` (`id: 'zzz'`, path `/zenless-zone-zero`, lazy `ZzzPage`); add selection cover + switcher icon assets

## 5. Verification

- [x] 5.1 If `PartiesView` mishandles the 3-uniform-slot config (four-slot assumption), fix the shared component within existing spec behavior
- [x] 5.2 `npm run lint && npm run format:check && npm test && npm run build`; `npx openspec validate --all`
- [x] 5.3 Manual pass: add agents, edit fields, reload persistence, build a 3-agent party, favorite/tier a party
