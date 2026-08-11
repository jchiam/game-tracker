## Context

HSR tracked characters record level, traces, six relic slots, and build preferences — but not the equipped Light Cone. Reverse: 1999 already solved the same problem for Psychubes: three columns on the tracked-entity table, an inline card section (summary line + Select/LevelSlider/SegmentedButtons edit view), plain field updates through the debounced save queue. This change ports that pattern to HSR with one game-rule difference: Light Cones are path-locked — a cone can only be equipped on a character of the matching Path — so the picker filters, where the Psychube picker does not.

Data source already in use: StarRailRes (`Mar-7th/StarRailRes`), fetched by `scripts/update-hsr-data.mjs`, which also exposes `index_new/en/light_cones.json` (id, name, rarity 3–5, path id, icon). The script already composes `scripts/lib/pipeline.mjs` (`ensureAsset`, `fetchJSON`, `downloadBinary`, `generatedHeader`, catalog diffing) and builds a path-id → display-name map from `paths.json`.

## Goals / Non-Goals

**Goals:**

- Track one equipped Light Cone per HSR character: catalog id, level 1–80, superimposition 1–5.
- Generated Light Cone catalog with images on ImageKit, refreshed by the existing weekly HSR data workflow.
- Path-filtered picker (hard constraint, mirrors the in-game equip rule).
- Card summary line (`Name · Lv N · S{n}`) and psychube-style inline edit section.

**Non-Goals:**

- Ascension tracking (character level is plain 1–80 too; parity).
- Light Cone participation in equipment-match scoring (no substats to match; score stays relic-only).
- Target/preferred Light Cone in build preferences.
- A separate equipped-cone table or per-cone inventory (one cone per character, no shared inventory).

## Decisions

**D1 — Columns on `hsr_tracked_characters`, not a new table.**
Psychube precedent. One cone per character, three scalar fields, no child rows. A join table would buy nothing and cost a persistence seam. Alternative (mirroring `hsr_equipped_relics`) rejected: relics need a table because there are six slots with variable substat rows; cones have neither.

**D2 — Stable key is the StarRailRes numeric id (stored as TEXT).**
Unlike Psychubes (name key, forced by a wiki source without stable ids), StarRailRes ships stable numeric light-cone ids. Store the id string; resolve name/rarity/path at render time from the catalog. No nullable-FK constraint — catalog lives in code, not DB (same as `relic_set_id`).

**D3 — Path filter is strict.**
Picker options = `ALL_LIGHT_CONES.filter(lc => lc.path === char.path)`, sorted rarity desc then name (catalog sort order, same as characters). Equipping is path-locked in game, so off-path options are illegal states — never shown. Same exact-string join-key contract as AE's weapon `type` ↔ operator `weapon` (see `ae-weapon-catalog`): the update script maps path ids through the same `pathMap` used for characters, so both sides of the join come from one vocabulary and cannot drift.

**D4 — Catalog generation extends `update-hsr-data.mjs`, third asset loop.**
Fetch `light_cones.json` alongside the existing three fetches; reuse `pathMap`; emit `src/data/honkai-star-rail/light_cones.ts` (`LightCone { id, name, rarity, path, imageUrl }`, `ALL_LIGHT_CONES`, sorted rarity desc → name) with the standard generated-file banner. Images: `public/assets/honkai-star-rail/light-cones/{id}.webp` local path convention, uploaded via `ensureAsset` with a `--reupload-light-cones` flag mirroring `--reupload-relics`. Rarity 3–5 all included (3★ cones are real equips, unlike 3★ characters which are non-playable).

**D5 — Persistence via existing roster-persistence column map; plain field updaters.**
`characterService` load config gains three columns in the select fragment + row mapping and insert defaults (`light_cone_id: null`, level 1, superimposition 1). Hook updaters are `makeFieldUpdater` declarations — no custom bodies, no `queueAction`. Equip/unequip and level ride the same debounced patch path as `psychubeName`/`psychubeLevel` in R1999. Defaults match Psychube semantics: unequip sets id to null, level/superimposition retain values.

**D6 — UI placement: inline card section, not RelicEditorModal.**
The cone is character progression (like level/traces), not build preference. `EquipmentEditorShell` is a two-tab scaffold (Relics + Target Build) — wedging a third concern in would break its shape for every game. Card gets one `ProgressSection label="Light Cone"` in the edit view and a summary line in collapsed view, both composed from shared primitives (`Select`, `LevelSlider`, `SegmentedButtons`); progress-gradient coloring on the summary segments mirrors `ArcanistCard`'s psychube line.

## Risks / Trade-offs

- [Existing rows get defaults level 1 / S1 with null cone] → Correct semantics: null id means "nothing tracked yet"; level/superimposition are inert until a cone is selected. No backfill needed.
- [StarRailRes drops or renames `light_cones.json` fields] → Same exposure as existing character/relic fetches; weekly workflow PR would surface breakage in diff review, not silently in prod.
- [A character's path changes across game versions (has happened with rerelease-style variants)] → Equipped cone id could become off-path for that character. Render still resolves and displays it; only the picker filters. No data loss, self-corrects on next user edit.
- [~150 new ImageKit uploads on first run] → One-time cost; `ensureAsset` skips on re-runs.

## Migration Plan

1. Migration `20260811000000_add_light_cone_to_hsr.sql`: `ALTER TABLE hsr_tracked_characters ADD COLUMN light_cone_id TEXT, ADD COLUMN light_cone_level INTEGER NOT NULL DEFAULT 1, ADD COLUMN light_cone_superimposition INTEGER NOT NULL DEFAULT 1;` — additive, no RLS change (row policies cover new columns), no rollback hazard.
2. Run `node scripts/update-hsr-data.mjs` once locally to generate `light_cones.ts` and upload images before the UI lands.
3. Code ships behind nothing — null cone renders the "No Light Cone" empty state, so deploy order (migration → code) is the only constraint.

## Open Questions

None — placement, path filtering, level semantics, scoring exclusion, and build-pref exclusion were all settled during exploration.
