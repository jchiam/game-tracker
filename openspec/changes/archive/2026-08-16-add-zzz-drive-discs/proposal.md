# Add ZZZ Drive Discs (Phase 2)

## Why

ZZZ Phase 1 shipped roster + parties only. Agents cannot yet record their equipped Drive Discs or a target build, so the tracker cannot answer the core question it answers for HSR, N2E, and P5X: "how close is this agent's gear to the build I want?" Phase 2 replays the proven HSR relic pattern (equipment editor + preference chains + equipment-match score) for ZZZ discs while the Phase 1 context is fresh.

## What Changes

- Extend `scripts/update-zzz-data.mjs` with a Drive Disc suit section: fetch Enka `store/zzz/equipments.json`, resolve suit names via `locs.json`, upload suit icons to ImageKit, emit a generated `src/data/zenless-zone-zero/disc_suits.ts` catalog (~30 suits).
- Add a hand-curated `disc_suit_short_names.ts` (suit id → one-word card label), mirroring HSR's `relic_short_names.ts`.
- New DB migration: `zzz_equipped_discs` (per-agent, slots 1–6) + `zzz_disc_substats` child table + `zzz_disc_preferences` single-table preference rows (P5X category-enum pattern) + `disc_comments` column on `zzz_tracked_agents`. RLS on all new tables.
- Extend `agentService.ts` with the `extras` seam (nested select + row mapping) and new write functions `upsertDisc`, `deleteDisc`, `saveDiscPreferences` (delegating to `savePreferenceRows`).
- Extend `useAgents` with `saveDiscData` / `removeDiscData` / `saveDiscPreferences` via `queueAction`, plus a `SCORE` sort mode driven by a `scoreFor` callback.
- New `DiscEditorModal` composed over `EquipmentEditorShell`: Equip tab (6 disc slots — suit `Select`, main-stat `Select` or fixed read-only, `SubStatList`) + Build Preferences tab (4pc/2pc suit `Select`s, `PreferenceChain` per variable main slot 4/5/6, global substat chain, `BuildComments`).
- Extend `AgentCard`: disc slot grid (`.equip-slot-grid`), suit digest summary line, Target Build readout (`PreferenceChainReadout`), `ScoreBadge` header extra + `temperScore`.
- New scoring adapter `src/utils/discScoring.ts` over the shared `createEquipmentScore` factory: ZZZ stat vocabulary, 4pc/2pc `setTerm`, slots 1–3 fixed-main handling.
- New `getZzzDiscSuitIconUrl` transform in `src/lib/imagekit.ts`.
- Deliberately not replayed from HSR: the editor's duplicated main-stat map (single source in the data module), the `emptyRelic`-vs-`null` slot asymmetry (removal writes `null`, matching reload), and the cavern/planar id-prefix family hack (ZZZ suits are one pool).

## Capabilities

### New Capabilities

- `zzz-disc-catalog`: generated Drive Disc suit catalog module + hand-curated short names + suit icon resolution.
- `zzz-disc-scoring`: equipment-match score for equipped discs vs build preferences (shared scoring core adapter, 4pc/2pc set term, grade badge).

### Modified Capabilities

- `zzz-agent-detail`: agent card gains disc slot grid, suit digest line, Target Build readout, and score badge; new disc editor modal; disc + preference persistence semantics.
- `zzz-data-pipeline`: update script additionally fetches `equipments.json`, uploads suit icons, and emits the disc suit catalog with `--reupload-discs` support.

## Impact

- **DB**: new migration `2026xxxxxxxxxx_add_zzz_disc_tables.sql`; additive only, no changes to existing rows.
- **Code**: `scripts/update-zzz-data.mjs`, `src/data/zenless-zone-zero/` (generated + curated files), `src/types.ts` (ZzzTrackedAgent gains `discs` + `buildPreferences`), `src/services/zenless-zone-zero/agentService.ts`, `src/hooks/zenless-zone-zero/useAgents.ts`, `src/pages/zenless-zone-zero/` (page + components), `src/utils/discScoring.ts`, `src/lib/imagekit.ts`.
- **No new external domains** (Enka CDN already used by the update script; app images stay on ImageKit).
- **Phase 3 seam**: card score renders the disc score directly this phase; the W-Engine blend (replaying HSR `buildScore.ts`) lands in Phase 3.
