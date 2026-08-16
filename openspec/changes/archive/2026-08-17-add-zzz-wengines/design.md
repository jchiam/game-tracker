## Context

Phase 2 shipped Drive Discs: the agent card renders `calculateDiscScore` directly via `ScoreBadge`, and SCORE sort passes it through `getFilteredRoster`. HSR already has the exact target shape for weapon tracking: equipped Light Cone as parent columns (`light_cone_id/level/superimposition`), a ranked `light_cone_preferences TEXT[]` array column written atomically through the plain field-update path, a dedicated `LightConeEditorModal` (Modal + `PreferenceChain` `variant="ranked-list"`), a card preference strip with overflow tile and tap-caption, and `buildScore.ts` blending the relic score with a preference-rank cone term (PRs #42/#43). The Enka store provides `store/zzz/weapons.json` (loc-key names, numeric rarity, `ProfessionType`, `ImagePath`, main/secondary stat ids).

## Goals / Non-Goals

**Goals:**

- W-Engine catalog generation + ImageKit icons in the existing update script.
- Equipped W-Engine (id, level, Phase) and ranked preferences per agent.
- Card: W-Engine summary line, preference strip, blended build score on the existing badge and SCORE sort.

**Non-Goals:**

- No changes to `discScoring.ts` — the blend wraps it.
- No W-Engine stat modelling (main/secondary stat values are display-irrelevant here; catalog stores identity only).
- No bangboo work (Phase 4, KIV).

## Decisions

**D1 — Parent columns + atomic array, no preference rows.** `zzz_tracked_agents` gains `wengine_id TEXT`, `wengine_level INTEGER DEFAULT 0`, `wengine_phase INTEGER DEFAULT 1`, `wengine_preferences TEXT[] DEFAULT '{}'`. Replays HSR's Light Cone shape exactly; a single-array preference list needs no `savePreferenceRows` and therefore never inherits the non-atomic delete-then-reinsert limitation. All four fields ride the existing `updateAgent` patch path (column-map additions only).

- Alternative considered: preference rows table (P5X revelation shape) — rejected; ranked flat list has no per-row operators or categories, and HSR proves the array column suffices.

**D2 — Generated catalog `wengines.ts`.** `ZzzWEngine { id, name, rarity, specialty, imageUrl }`; `ALL_ZZZ_WENGINES` sorted rarity descending then name (agents-file convention). Rarity stays numeric (2/3/4) and maps to B/A/S at display via the existing rarity badge mapping (agents already map 3→A, 4→S; add 2→B). `specialty` is `ProfessionType` verbatim — same enum the agent catalog uses. Names resolve through `locs.json` like agents and suits.

**D3 — Blend in new `src/utils/zzzBuildScore.ts`.** Same constants and semantics as HSR `buildScore.ts`: `ENGINE_WEIGHT 0.25` / `DISC_WEIGHT 0.75`; engine term = fixed-step rank decay (`1 − 0.25·rank`, floor 0.25); unequipped or off-build engine term = 0; empty preference list = don't-care (disc side alone); disc score −1 drops the disc side (engine side alone); −1 only when both sides inactive. Engine level and Phase are display-only and never affect the score. Game-scoped filename avoids colliding with the HSR file in editor search.

- Alternative considered: generalize a shared `createBuildScore` factory now — rejected; two call sites with identical constants is not yet a pattern worth the indirection (three games would be).

**D4 — Dedicated `WEngineEditorModal` for preferences; equip controls on the card.** Replays HSR: the ranked list lives in its own small modal (`Modal` + `PreferenceChain` `variant="ranked-list"`, options filtered by specialty, label `Name (S/A/B)`); the equip picker (`Select`), level `LevelSlider` (0–60), and Phase `SegmentedButtons` (P1–P5) live in a "W-Engine" `.card-section-group` in the card's edit body, alongside the preference strip with an Edit Preferences button that opens the modal. `EquipmentEditorShell` is wrong here — there is one list, not a two-tab equip/preferences editor.

**D5 — Preference strip replays HSR #43.** Icon tiles (`.equip-slot-cell` reuse), rank badge `#N`, equipped tile highlighted with the match colour, `+N` overflow tile after the cap, tap toggles a caption line — tiles are display-only; equip changes happen only in the explicit `Select` (no-state-change-on-icon-taps convention). Match badge on the summary line shows `#rank` or `Off-build` with progress-gradient colour.

**D6 — Strict specialty filter.** Both the equip picker and the preference modal list only engines whose `specialty` matches the agent's, mirroring HSR's strict path filter. Off-specialty engines lose their passive in game; tracking them is not a supported plan.

**D7 — Pipeline section replays suits.** `loadExistingWEngines()` regex re-parse for diffing, `generateWEnginesTs()` with `jsStr` Prettier-stable emit, per-engine `ensureAsset` from `${ENKA_CDN_BASE}${ImagePath}` to `/assets/zenless-zone-zero/wengines/{id}.png`, `parseReuploadFlags(['agents', 'discs', 'wengines'])`, added/removed diff output. `src/lib/imagekit.ts` gains `getZzzWEngineIconUrl` (`tr:w-128`, local-path fallback — engine art is square, same treatment as disc suit icons).

## Risks / Trade-offs

- [Enka `weapons.json` may include unreleased/test engines] → same exposure as agents/suits already accepted; weekly PR diff makes additions reviewable before merge.
- [Level floor uncertainty: engines start at level 0 in game, unlike HSR cones at 1] → slider range 0–60 with DB default 0; if wrong, a one-line range change, no migration.
- [Score badge meaning changes for existing users (disc score → blend)] → matches HSR behaviour users already know; empty preference list keeps the badge identical to today (don't-care renormalization).
- [`+N` overflow cap tuning] → reuse HSR's cap constant value; cosmetic, adjustable later.

## Migration Plan

Single additive migration `20260818000000_add_zzz_wengine_columns.sql` (ALTER TABLE only, no new tables, no RLS changes). Existing rows read back as null engine / level 0 / Phase 1 / empty preferences — UI treats that as untracked. Rollback = drop the four columns.

## Open Questions

None blocking — level-0 floor confirmed at implementation time against in-game behaviour is the only soft check.
