# Domain Language

Canonical glossary of the domain concepts used across this codebase, its openspec specs, and its documentation. Definitions live here; operational instructions (commands, code conventions, testing, guard rails) live in [`CLAUDE.md`](CLAUDE.md). When a term below is used in code review, specs, or architecture discussion, it means exactly what this file says.

## The Games

| Game                  | Short ID | Directory name          | Primary entity noun | Game-specific concepts                                                                                                       |
| --------------------- | -------- | ----------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Honkai Star Rail      | `hsr`    | `honkai-star-rail`      | **character**       | Relics (equippable, with substats), build preferences, relic scoring                                                         |
| Reverse: 1999         | `r1999`  | `reverse1999`           | **arcanist**        | Psychubes, afflatus; parties support `tier` and favorite toggle                                                              |
| Neverness to Everness | `n2e`    | `neverness-to-everness` | **character**       | Espers (`esperType` on each character), cartridges + cartridge preferences, arcs; parties support `tier` and favorite toggle |
| Arknights: Endfield   | `ae`     | `arknights-endfield`    | **operator**        | Weapons; Phase-1 scope is roster + parties; catalog is hand-authored (see Update Pipeline)                                   |

Each game is a self-contained module under `src/data/{game}/`, `src/services/{game}/`, `src/hooks/{game}/`, `src/pages/{game}/`, with shared code in `src/components/`, `src/lib/`, `src/utils/`, `src/types.ts`.

## Core Concepts

### Catalog

The static, game-wide list of entities that _can_ be tracked: `src/data/{game}/{entities}.ts` exporting an interface plus a `const ALL_{ENTITIES}` array (e.g. `ALL_CHARACTERS`, `ALL_ARCANISTS`, `ALL_OPERATORS`). Catalogs are generated artifacts produced by the Update Pipeline and are never hand-edited — with one exception: the AE operator catalog is hand-authored because AE has no stable structured data source (automating it is tracked as tech debt). Catalogs store local `/assets/{game}/…` image paths, never CDN URLs.

### Tracked Entity

A catalog entity the user has added to their roster, i.e. a row in the game's `{game_prefix}_tracked_{entities}` Supabase table merged with its catalog entry. Represented by the `{Game}Tracked{Entity}` interfaces in `src/types.ts`. A DB row whose entity id has no catalog match is dropped on load. The set of a user's tracked entities for one game is the **roster**.

### Data-Flow Model

Static catalog arrays are merged at runtime with the user's DB rows → hook state (`use{Entities}` per game) → components. Hooks apply optimistic updates with rollback on error. All writes go through the service layer and are batched/debounced via the shared `usePendingSaves` hook (1000 ms); nothing bypasses it for DB mutations.

### Field Updater

The optimistic-update contract for one tracked-entity field or field group, implemented once in the shared `useRoster` hook (`src/hooks/useRoster.ts`). `applyPatch(id, patch)` owns the mechanics: optimistic state set, ref lookup, the no-`dbId` guard (rows whose insert is still in flight update locally only), and the debounced DB write via `queueUpdate` merged per row. `makeFieldUpdater(field, { clamp?, transform? })` is single-field sugar over it, so per-game hooks declare updaters as data — `makeFieldUpdater('level', { clamp: [1, 80] })` — and the genuine per-game facts (clamp bounds, normalization like weapon-preference dedupe) are visible config instead of being buried in copied bodies. Requires `updateEntity` in the roster config (the game's persistence `update` function). Updaters that read current state (N2E awakening slots) or write through `queueAction` (relics, preference chains) stay hand-written in the game hook. The contract is tested once against `useRoster`.

### Roster Persistence

The config-driven factory `createRosterPersistence(config)` in `src/services/rosterPersistence.ts` — the single shared implementation of tracked-entity CRUD. Config supplies: table name, entity FK column, catalog array, patch-key→column map, insert defaults, own-table select string, and a `fromRow(row, base)` mapper. It produces `load` / `insert` / `remove` / `update` functions, and owns the `DB_ENABLED` early-return semantics (load → `[]`, insert → `null`, remove/update → no-op when Supabase is unconfigured), the `user_profiles` upsert before insert, the catalog merge on load, and error handling (log via `console.error`, then rethrow so hooks can roll back optimistic state). Each game's `{entity}Service.ts` is a thin config adapter over this factory that re-exports the produced functions under the game's public names (`loadCharactersFromDB`, `insertArcanist`, `deleteOperator`, …).

### Extras Adapter

The optional `extras: { selectFragment, mapRow }` seam on the roster-persistence config, for game-specific joined-table reconstruction at load time. `selectFragment` is appended to the base select; `mapRow(row, tracked)` runs after `fromRow` to attach structures built from joined tables. Used by HSR (equipped relics with substats, ordered build-preference chains) and N2E (ordered cartridge-preference chains and comments). Games without extras (R1999, AE) omit the adapter and incur no extra query cost.

### Preference Rows

Variable-length, ordered stat-preference chains (HSR build preferences, N2E cartridge preferences) persisted as child rows with sequential `order_index`. Saved exclusively through the shared `savePreferenceRows` helper in `src/services/rosterPersistence.ts`, which implements the delete-existing-rows-then-reinsert pattern — deliberately the _only_ implementation of that pattern, so the documented non-atomic-save limitation has exactly one future fix site (see Known Limitations in `CLAUDE.md`). Game-specific write functions that use it (`saveBuildPrefs`, `saveCartridgePreferences`) remain per-game exports.

### Party / Lineup

A saved team of tracked entities: a row in `{game_prefix}_parties` plus member rows in `{game_prefix}_party_members`, each member carrying a `slot_index` (0–3, maximum 4 members, enforced by CHECK constraint and `UNIQUE(party_id, slot_index)`). "Lineups" is the UI name for the parties view on each game page. R1999 and N2E parties additionally carry an optional `tier` and an `is_favorited` flag; HSR and AE parties have neither. After a save, the DB is the source of truth: the party hook reloads all parties.

App-side, all games share the single `Party` / `PartyMember` types in `src/types.ts`: a member is `{ entityId, slotIndex }` regardless of game — the per-game DB column name (`character_id`, `arcanist_id`, `operator_id`) is mapped at the party-persistence seam by `memberFromRow` / `memberToRow`, and `tier` / `isFavorited` are optional fields present only for the games whose tables carry them.

### Party Persistence Factory

The config-driven factory `createPartyPersistence(config)` in `src/services/rosterPersistence.ts` — the single shared implementation of party CRUD. Config supplies: parties table, members table, default party name, member row mappers (`memberFromRow` / `memberToRow`), and optional extras (`extraSelect` / `extraFromRow` / `extraToRow`) for game-specific party columns such as `tier` and `is_favorited`. It produces `loadParties`, `saveParty`, `deleteParty`, and `toggleFavoriteParty`; each game's `partyService.ts` is a thin config adapter re-exporting them (R1999 and N2E additionally re-export `toggleFavoriteParty`). Updating an existing party replaces its members via delete-then-reinsert — the same non-atomic pattern as Preference Rows, documented in the same Known Limitations entry.

Party error semantics are deliberately **asymmetric**:

- `loadParties` logs and **throws** — the shared party hook catches.
- `saveParty` never rejects: it logs and **resolves `null`** when the party-row insert/update fails, and still returns the party id when only the member insert fails (the row is already persisted; the returned id triggers the hook's reload so local state reflects true DB state). Nothing in the save call chain catches, so a thrown save error would surface as an unhandled promise rejection.
- `deleteParty` and `toggleFavoriteParty` log and **return `false`**.

With the DB disabled: `loadParties` → `[]`, `saveParty` → `null`, `deleteParty` / `toggleFavoriteParty` → `false`, without touching Supabase.

### Party View

The config-driven shared UI module `PartiesView` in `src/components/parties/` — the single implementation of the Lineups view (header, sorted card grid, empty and signed-out states, party card, create/edit editor modal with slot picker). Its per-game adapter is a `PartyViewConfig`: display nouns and placeholders, slot/list image resolvers, an optional slot accent class, `supportsTier` / `supportsFavorite` flags gating the tier selector, tier banner, favorite star, and the favorites-then-tier sort, and an optional variant class for game visual overrides (AE's lighter `endfield` card). The UI-side twin of the Party Persistence Factory: each game's `PartiesTab.tsx` is a thin config adapter over it, exactly as each game's `partyService.ts` is over the factory. View behaviour is tested once against `PartiesView`; per-game tests cover only config wiring.

### Update Pipeline

The build-time write side of the asset/data pipeline. Each game has a `scripts/update-{game}-data.mjs` that fetches the latest data from external sources, idempotently downloads and uploads images to ImageKit (skipping already-uploaded assets unless `--reupload-*` flags are passed), and regenerates that game's Catalog files — the script is the only producer of those files. Shared plumbing (env loading, ImageKit init/exists/upload, reupload-flag parsing, fetch/download, slug/escape helpers, catalog diffing, generated-file banner) lives once in `scripts/lib/pipeline.mjs`; scripts compose it, never copy it, while game-specific fetching, mapping, and codegen bodies stay in each script. A matching `.github/workflows/update-{game}-data.yml` runs weekly (plus manual dispatch) and auto-creates a PR when the run produced changes. Exception: AE currently has no automated pipeline — its operator catalog is hand-authored and portraits are seeded by a one-shot script until a structured source exists.

## Cross-References

- Operational conventions, directory layout, wiring checklist, testing patterns, guard rails: `CLAUDE.md`.
- Known Limitations (non-atomic preference saves and party-member replacement): `CLAUDE.md` → Known Limitations.
- Capability specs elaborating these concepts: `openspec/specs/shared-roster-persistence/`, `openspec/specs/shared-parties/`, `openspec/specs/shared-data-pipeline/`, `openspec/specs/shared-roster/`.
