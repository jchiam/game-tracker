## ADDED Requirements

### Requirement: Minted catalog ids are pinned to a stable upstream key

A generated catalog entry's `id` SHALL NOT be derived from a value the upstream source may change,
because it is the identity every tracked row, party slot, and preference row is keyed on. Every catalog whose
`id`s are minted by an update script SHALL carry a `sourceId` field holding the upstream source's own
stable key for that entity (`e.id` for N2E espers, `c.Id` for R1999 arcanists, `node.unitId` for P5X
personas). On each run the script SHALL look up an entity's already-minted `id` by its `sourceId` from
the existing generated file, and SHALL compute a fresh slug only for an entity whose `sourceId` is not
already present. A minted `id` SHALL therefore never change once assigned, for the lifetime of the
catalog entry.

#### Scenario: Upstream renames a tracked entity

- **WHEN** an update script runs and an entity's upstream display name has changed since the last run,
  while its upstream source key is unchanged
- **THEN** the regenerated catalog entry keeps its previously minted `id` and only its `name` changes,
  so existing tracked rows, party members, and preference rows still resolve against the catalog

#### Scenario: Upstream localizes a placeholder name

- **WHEN** an entity first appears with an untranslated or placeholder name and is later given its
  final localized name upstream
- **THEN** the `id` minted on first sight is retained across the rename, and no tracked row is orphaned

#### Scenario: New entity appears upstream

- **WHEN** an update script encounters a `sourceId` not present in the existing generated file
- **THEN** it mints a new `id` for that entity and records the `sourceId` alongside it, so the pairing
  is available to every subsequent run

#### Scenario: Catalog records the upstream key

- **WHEN** a script regenerates a catalog whose ids it mints
- **THEN** each emitted entry includes a `sourceId` field, and the generated interface declares it

### Requirement: Minted ids are non-empty and unique

Id minting SHALL go through a shared `mintId` helper in `scripts/lib/pipeline.mjs` rather than a bare
`slugify` call at each site. `mintId` SHALL never return an empty id: when the display name slugifies
to an empty string — a fully non-Latin name, for instance — it SHALL fall back to an id derived from
the entity's `sourceId`. `mintId` SHALL reject a duplicate: when a minted id collides with one already
taken in the same run, the script SHALL fail with an error naming the colliding entities rather than
emitting a catalog containing two entries with the same `id`.

#### Scenario: Name slugifies to nothing

- **WHEN** an entity's upstream name contains no `[a-z0-9]` characters after normalization
- **THEN** `mintId` returns a `sourceId`-derived id instead of an empty string, and that id is what the
  catalog entry and its asset path use

#### Scenario: Two entities would mint the same id

- **WHEN** two entities in one run mint the same id
- **THEN** the script throws, naming both entities and the colliding id, and no catalog file is written

#### Scenario: Minting is unit tested

- **WHEN** `npm test` runs
- **THEN** `scripts/lib/pipeline.test.mjs` verifies that `mintId` prefers an existing pinned id over a
  name-derived slug, falls back to a `sourceId`-derived id when the slug is empty, and throws on a
  collision

## MODIFIED Requirements

### Requirement: Shared update-pipeline helper library

Update scripts SHALL compose the shared helpers in `scripts/lib/pipeline.mjs` — env
loading (`loadLocalEnv`), ImageKit init/existence-check/upload (`initImageKit`), the
per-asset skip-or-upload skeleton (`ensureAsset`), asset-path derivation
(`toImageKitLocation`), reupload-flag parsing (`parseReuploadFlags`), fetch/download
(`fetchJSON`, `downloadImage`), id and string helpers (`mintId`, `slugify`, `esc`), catalog
diffing (`diffByKey`, `formatDiff`), and the generated-file banner (`generatedHeader`)
— instead of carrying private copies. The lib SHALL be the only implementation of this
plumbing; game-specific fetching, data mapping, and codegen bodies stay in each script.
Per-asset processing SHALL go through `ensureAsset`: it skips when the asset is already
on ImageKit (unless reupload was requested), otherwise fetches via the script's
source-specific closure and uploads, returning `'skipped'` / `'uploaded'` / `'failed'`
for the caller's counters and missing-asset lists. Catalog `id` minting SHALL go through
`mintId`; `slugify` remains available for non-identity slugs (asset variant names, lookup
keys) but SHALL NOT be the direct source of a catalog entry's `id`.

#### Scenario: Scripts share one ImageKit implementation

- **WHEN** the ImageKit existence check or upload behaviour needs to change
- **THEN** the change is made once in `scripts/lib/pipeline.mjs` and applies to every
  game's update script

#### Scenario: New game script composes the lib

- **WHEN** a new game's `update-{game}-data.mjs` is written (e.g. the pending AE
  pipeline)
- **THEN** it imports the lib helpers rather than copying plumbing from an existing
  script

#### Scenario: Per-asset ensure skeleton is shared

- **WHEN** an update script processes one asset
- **THEN** it calls the lib's `ensureAsset` with a source-specific fetch closure —
  never a hand-written exists-check/reason-log/try-catch/upload block — and derives
  its uploaded counters and missing-asset lists from the returned result

#### Scenario: Script mints a catalog id

- **WHEN** an update script assigns an `id` to a catalog entry
- **THEN** it calls `mintId` with the entity's name, its upstream source key, and the ids
  already taken in that run — never `slugify` directly

#### Scenario: Pure helpers are unit tested

- **WHEN** `npm test` runs
- **THEN** `scripts/lib/pipeline.test.mjs` verifies the pure helpers (mintId, slugify, esc,
  toImageKitLocation, diff/format, reupload-flag parsing, generated header), the
  ImageKit-disabled early-return path, and the `ensureAsset` skip/upload/reupload/fail
  contract
