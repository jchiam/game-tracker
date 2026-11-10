# Design

## Context

See `proposal.md` — Why. Phase 1 reserved Memory Fragments for Phase 3; Phase 2 (`openspec/changes/archive/2026-11-09-add-czn-phase-2-partners/design.md`) left the script with a per-catalog section pattern (`processCombatants`, `processPartners`), pure helpers under `scripts/lib/czn-*.mjs`, the overlay-seed rules, and `uploadAsset` / `seedAssets`.

Recon on 2026-11-09 against the CloudFront origin (`d2ankz0m1a0dsp.cloudfront.net`): `/page-data/chaos-zero-nightmare/memory-fragments/page-data.json` exists but carries no data (`result.pageContext: {}`, `staticQueryHashes: []`); the same holds for `/equipment/`. The set list is a hardcoded array inside the page's webpack component chunk — `webpack.stats.json` → `assetsByChunkName["component---src-pages-chaos-zero-nightmare-memory-fragments-tsx"]` → the `component---…-<hash>.js` asset — as `[{ID:15,Name:"Beast's Yearning",Effect:'…',Type:"4-PC"}, …]` (18 sets, IDs 1–18, 12 × 4-PC, 6 × 2-PC). The same chunk inlines Gatsby fixed-image data for each set: `/static/<hash>/{f57b3,bde72,927d1}/set_full_<ID>.webp` (15w/30w/60w) and `set_small_<ID>.webp` for IDs 1–6 only; the originals are not published, so 60² is the largest icon Prydwen serves anywhere (characters/equipment/team-builder chunks carry no larger set art). Game8's list page (`game8.co/games/Chaos-Zero-Nightmare/archives/560572`) has 22 sets with 165² icons, including four Prydwen lacks; Game8 spells `Conqueror's Aspect` where Prydwen has `Conquerer's Aspect`.

Slot and stat model (Prydwen "Memory Fragments Stats" guide, cross-checked with CZN.gg and Game8): six slots typed I Shock, II Suppression, III Denial, IV Ideal, V Desire, VI Imagination. Slots I–III have fixed mains Flat ATK / Flat DEF / Flat HP; IV rolls `ATK%, HP%, Critical Chance%, Critical Damage%`; V rolls `ATK%, HP%, Passion Damage%, Justice Damage%, Order Damage%, Void Damage%, Instinct Damage%`; VI rolls `ATK%, DEF%, HP%, Ego Recovery`. The substat pool is the same for every slot and set: `Flat ATK, Flat DEF, Flat HP, ATK%, DEF%, HP%, Critical Chance%, Critical Damage%, Ego Recovery, Extra Damage%, Damage over Time%`; up to four per piece, no duplicates, never equal to the main (flat and percent of one base count as different stats). A set is either a 2-PC set or a 4-PC set, never both. Rarity (Uncommon/Rare/Legendary) sets the level cap (3/4/5) and starting substat count.

Pinned with the user on 2026-11-09: HSR relic shape (per-slot equipped pieces + Target Build preferences + score badge); no per-piece rarity or level; substats as stat names only.

## Goals / Non-Goals

**Goals:**

- Clone the ZZZ Drive Disc stack (the closest existing shape: six numeric slots, fixed mains on 1–3, 4-PC + 2-PC set picks, one category-keyed preference table, blended build score) onto CZN with zero new shared-layer patterns.
- Keep the Phase 1–2 script paths untouched; add the fragment-set section beside them and move only the seed id rule into a shared CZN helper.
- Card: append after Preferred Partners; never reshuffle existing sections or chips.

**Non-Goals:**

- Set effect text anywhere (catalog, picker, readout) — copy, not tracked state (Phase 2 Partner precedent).
- Per-piece rarity, level, or substat values; a piece-level "maxed" flag.
- Expressing a triple-2-PC target composition (the preference model is one 4-PC pick plus one 2-PC pick, as in ZZZ).
- A larger icon source than Prydwen's 60² for sets Prydwen carries (the seed's `imageSource` already allows Game8 art for sets Prydwen lacks; swapping Prydwen-carried icons is a later data task if 60² proves too soft).
- Fuse search over set names, roster filter chips on fragment state, fragment-specific sort beyond the score mode.

## Decisions

**D1 — Set source = the `memory-fragments` page component chunk, located via `webpack.stats.json` per run, parsed without evaluation.**
There is no page-data or static query for sets, so the chunk is the only structured source on the origin. `webpack.stats.json` is served at the origin root and maps the stable chunk name to the hashed asset filename, so nothing is hardcoded beyond the chunk name. The array is extracted with a regex over the literal shape `{ID:<int>,Name:"…",Effect:<quoted>,Type:"…"}` (`parseFragmentSetEntries` in `scripts/lib/czn-fragments.mjs`); the script never `eval`s or `new Function`s downloaded JavaScript. Alternatives: fetching Prydwen's rendered HTML (Cloudflare-challenged); Game8 as the fetched source (rendered HTML, no structured endpoint, and the seed already covers its surplus); a hand-maintained set catalog (rejected: the weekly run must pick up new sets). Shape drift (no chunk, zero sets parsed) aborts non-zero naming the asset; an ID with no icon binding or srcset is still emitted and its icon counted as missing in the run output.

**D2 — Icon path map from the same chunk: ID → the largest-width hashed `/static/…` path of the image the chunk binds to that ID.**
The chunk renders each set's icon through a chain of `<ID>===t&&createElement(Img,{src:"…/<file>.webp"})` conditionals and inlines each image's Gatsby srcset. The binding is positional, not derived from the ID — on the 2026-11-09 build IDs 1–6 use `set_full_1..6`, IDs 7–12 use `set_small_1..6`, 13 uses `set_full_8` and 14 `set_full_7` — so `selectFragmentIconPaths` reads the ID→file binding and then the file's srcset, picking the largest advertised width (60w on the current build), rather than guessing a filename from the ID. Hashed directories and bindings are both read per run, never hardcoded (the `/static/` hashes change per build — Phase 1 rule). Uploaded as webp at source size to `chaos_zero_nightmare/fragment-sets/{id}.webp`. 60² is small: the slot grid renders icons at 80% of a cell (`.equip-slot-img`, ≈40 px on a card), so 60² is 1× sharp and slightly soft at 2×. Accepted and flagged in Risks; the seed's `imageSource` carries Game8 165² icons for the four sets Prydwen lacks.

**D3 — `id = slugify(name, '-')` via `mintId`, as for Partners; the seed id rule becomes the shared `assertMintedSeedIds` in `scripts/lib/czn-seeds.mjs`.**
Prydwen's numeric `ID` is tempting as a key but the seed-covered sets have no Prydwen ID until Prydwen adds them in an unknown order, so hand-off would break; the name slug is the only identity both sides share (Phase 2 D2). `assertPartnerSeedIds` is already generic (takes `label` and `mint`); it is renamed and moved so both seeds import one rule, with `czn-partners.mjs` and its test updated — a rename, not a behaviour change. Prydwen's `Conquerer's Aspect` yields `conquerer-s-aspect` (`slugify` turns the apostrophe into its own separator); if Prydwen fixes the typo the id changes and tracked rows keep the old slug (see Risks).

**D4 — Catalog `CznFragmentSet { id, name, pieces: 2 | 4, imageUrl }`, sorted by name; `Type` `"4-PC"`/`"2-PC"` maps to `pieces` and anything else aborts.**
`pieces` is the only taxonomy the UI needs (the 4-PC pick offers 4-PC sets, the 2-PC pick offers 2-PC sets). `Effect` is dropped (Non-Goal). Alphabetical order matches the ZZZ suit catalog; the editor's slot set select and the two pick selects all read the generated order.

**D5 — Hand-maintained `fragments.ts` holds the slot model; `fragment_set_short_names.ts` holds card labels.**
Slot names, fixed mains, main pools, and the substat pool are game knowledge, not derivable from any fetched source — the ZZZ `discs.ts` precedent, explicitly exempt from the generated-file rule by its header. Spelling follows Prydwen's stats guide (`Flat ATK`, `ATK%`, `Critical Chance%`, `Critical Damage%`, `Ego Recovery`, `Extra Damage%`, `Damage over Time%`, `<Element> Damage%`) because that is the vocabulary the catalog source uses. Short names are one word per set, hand-curated, fallback to the full name (ZZZ precedent).

**D6 — Persistence = ZZZ disc tables renamed: `czn_equipped_fragments(tracked_combatant_id, slot SMALLINT 1–6, set_id, main_stat, UNIQUE(tracked_combatant_id, slot))`, `czn_fragment_substats(fragment_id, stat_type)`, `czn_fragment_preferences(tracked_combatant_id, category ∈ {slot4_main, slot5_main, slot6_main, sub_stats}, stat, operator_to_next ∈ {>, >=, OR}, order_index)`; parent columns `fragment_set_4_id`, `fragment_set_2_id`, `fragment_comments`.**
One migration `20261109000002_add_czn_fragment_tables.sql`. Policies are owner-scoped `EXISTS` joins written with `(select auth.uid())::text` (the cached form the 2026-09-11 linter pass standardised on), FK indexes on each child. Writes go through `upsertEquipmentSlot` (`upsert_equipment_slot` RPC: row upsert + substat replace in one statement) and `savePreferenceRows` (`replace_preference_rows`); both already pass `assert_game_table` for `czn_*`. Alternatives: a JSONB `sub_stats` column (P5X; rejected — the repo moved to the RPC path and P5X is the outlier); HSR's two preference tables (rejected — the single category table is the newer shape). The postgres:16 harness run is a task because the RLS joins on the new tables and the RPC allowlist path are not covered by unit tests.

**D7 — Model: `fragments: Record<CznFragmentSlot, CznEquippedFragment | null>`; removal writes `null`, never an empty-piece sentinel.**
ZZZ rule, so in-session state matches a reload. `CznEquippedFragment { setId: string | null; mainStat: string | null; subStats: string[] }` mirrors `ZzzEquippedDisc`. `CznFragmentBuildPreferences { mainStats: Record<4 | 5 | 6, StatPreference[]>; subStats: StatPreference[]; set4Id?: string | null; set2Id?: string | null; comments?: string }`.

**D8 — Hook API: `saveFragmentData({ combatantId, slot }, piece)`, `removeFragmentData({ combatantId, slot })`, `saveFragmentPreferences(combatantId, prefs)` via `queueAction` with keys `${dbId}-frag-${slot}`, `${dbId}-frag-${slot}-delete`, `${dbId}-fragprefs`.**
These read nothing from current state but write through an RPC rather than a row patch, so they are the `queueAction` case the Field Updater rule allows (HSR/ZZZ precedent). `useCombatants` additionally destructures `setTrackedEntities` and `queueAction` from `useRoster`.

**D9 — Editor: `FragmentEditorModal` over `EquipmentEditorShell`; slot cards labelled `I · Shock` … `VI · Imagination`.**
Equip tab: per slot a set `Select` over `ALL_CZN_FRAGMENT_SETS` (label `{name} [{pieces}-PC]`, "None" clears), fixed main shown read-only on 1–3, main `Select` from `CZN_FRAGMENT_MAIN_STATS[slot]` on 4–6, `SubStatList` (max 4, `excludeValues=[main]`); controls gated until a set is chosen; save prunes the main from the substats and forces the fixed main on 1–3. Build Preferences tab: 4-PC `Select` over `pieces === 4`, 2-PC `Select` over `pieces === 2`, `PreferenceChain` for slots 4, 5, 6 (options = that slot's pool), substat chain (options = the pool), `BuildComments`. `useScrollAnchor` for the anchor slot. Only shared primitives — no raw controls.

**D10 — Scoring: `fragmentScoring.ts` = `discScoring.ts` with the CZN vocabulary and a simpler set term; `cznBuildScore.ts` = `zzzBuildScore.ts` with the Partner list.**
Set term `min(count4, 4)/4 × 0.67 + min(count2, 2)/2 × 0.33` with no spill rule — a set cannot be both picks because `pieces` is fixed per set, so the ZZZ same-suit branch is unreachable and omitted. Stat shapes: `Flat ATK`/`ATK%` → `atk`, `Flat DEF`/`DEF%` → `def`, `Flat HP`/`HP%` → `hp`, `Critical Chance%` → `crit-rate`, `Critical Damage%` → `crit-mult`; element `Damage%`, `Ego Recovery`, `Extra Damage%`, `Damage over Time%` exact-match only. Partner term: rank #1 = 1.0, −0.25 per rank, floor 0.25, off-build or unequipped 0; Partner level and Ego never score. Blend 0.25/0.75 with active-side renormalisation; `-1` only when both sides are inactive. A score sort mode joins ALPHA/LEVEL in `useRosterView` config (ZZZ precedent: unscored last).

**D11 — Card: `headerExtra = <ScoreBadge>` + `temperScore`; `summaryLine` gains a digest line; edit body appends a labeled **Memory Fragments** group.**
Digest = equipped sets grouped by `setId`, `{shortName} ×{count}` sorted count desc, em-dash when no piece is equipped (ZZZ `AgentCard` precedent). The group (`.card-section-group` + header) holds the `.equip-slot-grid` with six `.equip-slot-cell`s (set icon via `getCznFragmentSetIconUrl` when `setId` is set, else the Roman numeral glyph I–VI; `.active` when equipped; click → `onToggleFragment(slot)`) and, when any preference or comment exists, a Target Build `ProgressSection` (set badges for the two picks, `PreferenceChainReadout` per slot chain and the substat chain, comments). `CznPage` holds `editingFragment: { combatantId, slot } | null`, renders the modal, and calls `projection.refreshBasis(id)` on close.

**D12 — Pipeline section `processFragmentSets()` beside `processPartners()`; seed `scripts/seeds/czn-fragment-sets.json` validated by `validateOverlaySeed` (`required: ['id','name','pieces']`) plus local `pieces ∈ {2, 4}` and `assertMintedSeedIds`; `--reupload-fragment-sets`.**
Same `seedAssets` / `applyOverlay` / shadowed-warning flow as Partners. Initial seed: the four Game8-only sets with Game8 `imageSource` and notes. Workflow PR copy names combatants, partners, and Memory Fragment sets and all three seeds.

**D13 — Docs: `CONTEXT.md` adds **Memory Fragment** (and Set) to the CZN row and a definition beside Partner; `CLAUDE.md` `czn` block adds the chunk seam, the no-eval rule, the slot model file, the set seed, and the flag.**

## Risks / Trade-offs

- [Prydwen moves the set list out of the chunk (e.g. into Contentful) or renames the chunk] → `webpack.stats.json` lookup or the parse yields nothing and the run aborts non-zero naming the chunk; the weekly run surfaces it and the fix is a helper change, not a data edit.
- [Prydwen fixes `Conquerer's Aspect`] → minted id changes; equipped rows and picks keep `conquerer-s-aspect` and render as an unknown set (glyph cell, raw id in the digest) until re-picked. Rare, visible, not a crash; the run's `removed`/`added` diff flags it in PR review. Same rule as Partner renames (Phase 2).
- [60² icons look soft on high-DPI cards] → Accepted for Phase 3 (icons render ≈40 px). If it grates, a data task adds Game8 165² `imageSource` overrides; no schema or UI change.
- [Regex parse over minified JS is brittle] → The helper is unit-tested against a captured fixture of the current chunk and the parse asserts a non-empty result with every `Type` in `{2-PC, 4-PC}`; an ID without an icon binding is reported as a missing icon, not a parse failure.
- [Three new RLS-joined tables + RPC allowlist path untested in CI] → Run the postgres:16 harness ([[rpc-migration-verification-harness]]) applying the full migration history, exercising `upsert_equipment_slot` and `replace_preference_rows` against the CZN tables and checking cross-user isolation, before `db push`.
- [Stat spelling drift between Prydwen's guide and in-game text] → Spelling is a display vocabulary held in one file (`fragments.ts`); stored stat strings must match it, so a respelling is a migration-free rename only if done before rows exist. Pinned now from the Prydwen guide.
- [22 extra ImageKit uploads on first run; index lag re-uploads a few on the second] → Known behaviour; third run reports all skipped.

## Migration Plan

1. Verify `supabase/migrations/20261109000002_add_czn_fragment_tables.sql` in the postgres:16 harness, then apply with `npx supabase db push --remote` (user-run) before merging; existing rows gain null parent columns and no child rows.
2. Run `node scripts/update-czn-data.mjs` locally to seed `chaos_zero_nightmare/fragment-sets` and commit the generated `fragment_sets.ts` (plus any combatant/partner diff).
3. Merge; Vercel deploys on push to `main`.
4. Rollback: revert the app commit; the tables and columns can stay (nullable, cascade-scoped) — dropping them is a separate migration if ever wanted.

## Open Questions

- Exact one-word short names for the 22 sets — a data task during implementation; the fallback is the full name.
