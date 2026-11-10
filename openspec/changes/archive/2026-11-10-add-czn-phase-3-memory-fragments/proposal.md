# Proposal

## Why

Chaos Zero Nightmare Phases 1–2 (archived `2026-11-09-add-czn-phase-1-roster-parties`, `2026-11-09-add-czn-phase-2-partners`) track combatants, parties, and the per-combatant Partner, but not Memory Fragments — CZN's six-slot set gear, the analog of HSR relics and ZZZ Drive Discs. Players farm fragments per combatant toward a target set composition and stat spread and want to see, per card, what is equipped against what the build wants. This is **Phase 3**: the Memory Fragment set catalog, per-slot equipped tracking, build preferences, the equipment editor, and the build score — the last catalog the game has.

## What Changes

- New generated catalog `src/data/chaos-zero-nightmare/fragment_sets.ts` — `CznFragmentSet { id, name, pieces: 2 | 4, imageUrl }`, `ALL_CZN_FRAGMENT_SETS` sorted by name. Prydwen has no page-data for the set list: the 18 sets live as a hardcoded array inside the `memory-fragments` page's webpack component chunk, together with the hashed `/static/` paths of their 60² icons. The update script locates that chunk via `webpack.stats.json` each run and parses the array without evaluating it. `id` is the kebab-case slug minted from the name (no upstream slug, no per-set pages). A new overlay seed `scripts/seeds/czn-fragment-sets.json` covers sets Prydwen lags on (Game8 lists 22 as of 2026-11-09: Sanguine Thorn, Battlefield Evolution, Veiled Radiance, Snowflake of Our First Meeting are missing). Icons upload to ImageKit `chaos_zero_nightmare/fragment-sets`; `--reupload-fragment-sets` flag; the weekly workflow's PR copy covers all three catalogs.
- New hand-maintained `src/data/chaos-zero-nightmare/fragments.ts` — the slot model (slots 1–6 named Shock, Suppression, Denial, Ideal, Desire, Imagination; fixed mains Flat ATK / Flat DEF / Flat HP on slots 1–3; variable main pools for slots 4–6; the shared 11-stat substat pool), single-sourced for the editor and the scorer. Hand-curated `fragment_set_short_names.ts` for the card digest.
- New tracked state on `CznTrackedCombatant`: `fragments` (six slots, each `{ setId, mainStat, subStats: string[] } | null` — stat names only, no values, no rarity, no level) and `fragmentPreferences` (4-PC set pick, 2-PC set pick, main-stat preference chains for slots 4–6, one substat chain, comments). New tables `czn_equipped_fragments`, `czn_fragment_substats`, `czn_fragment_preferences` plus three parent columns, written through the existing `upsert_equipment_slot` / `replace_preference_rows` RPCs.
- New `FragmentEditorModal` composed over the shared `EquipmentEditorShell`: Equip tab with six slot cards (set select over all sets, read-only fixed main on slots 1–3 / main select from the slot pool on 4–6, substat list of up to four), Build Preferences tab (4-PC set select over 4-PC sets, 2-PC set select over 2-PC sets, three main chains, substat chain, comments).
- Combatant card gains a header `ScoreBadge`, a set-digest summary line (short names × piece counts, em-dash when empty), and — after Preferred Partners — a labeled **Memory Fragments** group with the six-cell slot grid (set icon or slot-numeral glyph; click opens the editor anchored to that slot) and the gated Target Build readout.
- New scorers: `calculateFragmentScore` (config adapter over the shared `createEquipmentScore`, set term 4-PC pick graded /4 at 0.67 + 2-PC pick graded /2 at 0.33) and `calculateCznBuildScore` blending the fragment score (0.75) with the Partner preference-rank term (0.25) under the ZZZ/HSR active-side rules. Roster gains a score sort mode.
- `src/lib/imagekit.ts` gains `getCznFragmentSetIconUrl` (ZZZ disc-suit precedent).
- Docs: `CONTEXT.md` adds the **Memory Fragment** noun under CZN; `CLAUDE.md`'s `czn` block documents the webpack-chunk seam, the no-eval parse rule, the set seed, and the flag.
- **Deferred** (explicitly out of scope): per-piece rarity and upgrade level, substat values, set effect text in the catalog or UI, triple-2-PC target compositions, Fuse search over set names, roster filter chips on fragment state.

## Capabilities

### New Capabilities

- `czn-fragment-catalog`: Generated static catalog of CZN Memory Fragment sets (`ALL_CZN_FRAGMENT_SETS`) with minted kebab-case ids, 2-PC/4-PC piece type, 60² icon paths and the ImageKit resolver, the hand-curated short-name map, the hand-maintained single-sourced slot/stat-pool model, and the overlay seed for sets the source lacks.
- `czn-fragment-tracking`: Per-combatant equipped Memory Fragments (six slots: set, main stat, up to four substat names), the fragment build preferences (4-PC pick, 2-PC pick, slot 4–6 main chains, substat chain, comments), the fragment editor modal, and the card's slot grid, set digest, and Target Build readout.
- `czn-fragment-scoring`: Fragment equipment-match score (0–100 / `-1`) over the shared equipment-scoring core with the CZN set term, slot main-stat rules, and stat-shape vocabulary.
- `czn-build-scoring`: Blended combatant build score (fragment score + Partner preference-rank term), the header score badge, and the score sort mode.

### Modified Capabilities

- `czn-data-pipeline`: The update script also emits `fragment_sets.ts` and seeds set icons from the Prydwen webpack chunk (located per run, parsed without evaluation, hashed icon paths resolved per run), with the set overlay seed, `--reupload-fragment-sets`, and workflow copy covering three catalogs.
- `czn-combatant-detail`: Card composition gains the score badge, the set digest line, and the Memory Fragments group (slot grid + Target Build) after Preferred Partners; the roster gains a score sort mode.

## Impact

- **New code**: `src/data/chaos-zero-nightmare/fragment_sets.ts` (generated), `fragments.ts`, `fragment_set_short_names.ts`, `scripts/seeds/czn-fragment-sets.json`, `scripts/lib/czn-fragments.mjs` (+ test: chunk selection, no-eval array parse, icon path map, effect-free mapping), `scripts/lib/czn-seeds.mjs` (the minted-id seed rule, moved from `czn-partners.mjs`), `src/utils/fragmentScoring.ts` (+ test), `src/utils/cznBuildScore.ts` (+ test), `src/pages/chaos-zero-nightmare/components/FragmentEditorModal.tsx` / `.css` (+ test), `supabase/migrations/20261109000002_add_czn_fragment_tables.sql`.
- **Modified code**: `scripts/update-czn-data.mjs` (fragment-set section, flag, header), `scripts/lib/czn-partners.mjs` (+ test; seed rule import), `.github/workflows/update-czn-data.yml` (PR copy), `src/types.ts` (`CznFragmentSlot`, `CznEquippedFragment`, `CznFragmentBuildPreferences`, `CznTrackedCombatant`), `src/lib/imagekit.ts` (+ test), `src/services/chaos-zero-nightmare/combatantService.ts` (+ test: extras, `upsertFragment`, `deleteFragment`, `saveFragmentPreferences`), `src/hooks/chaos-zero-nightmare/useCombatants.ts` (+ test), `CombatantCard.tsx` / `.css` (+ test), `CznPage.tsx` (+ test), `AddCombatantModal.test.tsx` / `PartiesTab.test.tsx` fixtures, `CLAUDE.md`, `CONTEXT.md`.
- **Database**: one migration adding `fragment_set_4_id TEXT`, `fragment_set_2_id TEXT`, `fragment_comments TEXT` to `czn_tracked_combatants` and creating `czn_equipped_fragments` (slot 1–6, `UNIQUE(tracked_combatant_id, slot)`), `czn_fragment_substats`, `czn_fragment_preferences` (category CHECK `slot4_main | slot5_main | slot6_main | sub_stats`), each with RLS owner policies and FK indexes. No RPC change — `assert_game_table` already allows `czn_*` (Phase 1); the RPC paths against the new tables are verified in the postgres:16 harness.
- **Infra**: ImageKit gains a `chaos_zero_nightmare/fragment-sets` folder. No CSP change.
- **No breaking changes**: existing CZN rows load with empty slots and empty preferences; nothing outside CZN changes except the seed-rule helper move, which is a pure rename for the Phase 2 script.
