# shared-data-pipeline Specification

## Purpose

The build-time write/update half of the asset pipeline, shared by every game. Each game has a
`scripts/update-{game}-data.mjs` that fetches the latest data from external sources, idempotently
uploads images to ImageKit (with `--reupload-*` overrides), and regenerates the static catalogs
under `src/data/{game}/*.ts` — which are generated artifacts, never hand-edited. A weekly
`.github/workflows/update-{game}-data.yml` runs the script and opens a PR when there are changes.
The pipeline plumbing shared by every script lives in `scripts/lib/pipeline.mjs`.
Generated catalogs store local `/assets/{game}/…` paths, not CDN URLs; runtime resolution of those
paths to ImageKit URLs is the read-side counterpart owned by `shared-image-pipeline`, with the
`/assets/{game}/…` path convention as the sole contract between the two halves.

## Requirements

### Requirement: Per-game update script regenerates static data files

Each game SHALL have a `scripts/update-{game}-data.mjs` that fetches the latest entity/equipment
data from external sources and regenerates that game's static catalog files under
`src/data/{game}/*.ts`. The script SHALL be the only producer of those files.

#### Scenario: Update script regenerates the catalog

- **WHEN** `node scripts/update-{game}-data.mjs` runs
- **THEN** it fetches from the game's external source and rewrites the `src/data/{game}/*.ts`
  catalog files with the latest data

#### Scenario: New game follows the pattern

- **WHEN** a new game is added to the tracker
- **THEN** it gains a `scripts/update-{game}-data.mjs` of the same shape as the existing
  HSR/N2E/R1999 scripts

### Requirement: Static data files are generated and never hand-edited

The files under `src/data/**` SHALL be treated as generated artifacts and SHALL NOT be edited by
hand; changes are made by editing the update script and re-running it.

#### Scenario: Data change goes through the script

- **WHEN** an entity catalog needs to change
- **THEN** the update script (or its data source) is changed and re-run, never the generated
  `src/data/**` file directly

### Requirement: Asset upload is idempotent with explicit reupload overrides

The update script SHALL upload downloaded images to ImageKit idempotently — an asset already
present on ImageKit SHALL be skipped on subsequent runs. Force-reupload SHALL be available via
explicit flags (`--reupload-all` and per-type variants such as `--reupload-relics`).

#### Scenario: Existing asset skipped

- **WHEN** the script runs and an image is already present on ImageKit
- **THEN** the upload is skipped, so re-running the script is safe and cheap

#### Scenario: Forced reupload

- **WHEN** the script is run with `--reupload-all` (or a per-type reupload flag)
- **THEN** the matching assets are re-uploaded even if already present on ImageKit

### Requirement: Data regeneration is independent of ImageKit credentials

The update script SHALL regenerate the data files whether or not ImageKit credentials are present;
when `IMAGEKIT_PRIVATE_KEY` is unset, image uploads SHALL be skipped while data-file regeneration
still proceeds.

#### Scenario: No ImageKit credentials

- **WHEN** the script runs without `IMAGEKIT_PRIVATE_KEY` configured
- **THEN** it logs that uploads are skipped and still regenerates the `src/data/{game}/*.ts` files

### Requirement: Generated data stores local asset paths, not CDN URLs

The regenerated catalog files SHALL store local `/assets/{game}/{type}/{id}.webp` paths, never
ImageKit CDN URLs. Runtime resolution of those paths to CDN URLs SHALL remain owned by the
`shared-image-pipeline` capability; this capability references that read path and SHALL NOT
redeclare it. The `/assets/{game}/…` path is the sole contract between the write side (upload) and
the read side (resolution).

#### Scenario: Catalog stores a local path

- **WHEN** the update script writes an entity's image reference into `src/data/{game}/*.ts`
- **THEN** it writes the local `/assets/{game}/{type}/{id}.webp` path, and the matching bytes are
  uploaded to the ImageKit location derived from that same path

#### Scenario: Read path is not duplicated here

- **WHEN** this capability is reviewed against `shared-image-pipeline`
- **THEN** the local→CDN URL resolution and local-path fallback appear only as cross-references,
  with the canonical requirement living in `shared-image-pipeline`

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

### Requirement: Weekly workflow runs the script and auto-PRs changes

Each game SHALL have a `.github/workflows/update-{game}-data.yml` that runs on a weekly `schedule`
cron and on manual `workflow_dispatch`, executes the update script, formats the result, and opens
a pull request only when the run produced changes. The run step SHALL provide the `IMAGEKIT_*`
secrets (`IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT`) as environment
variables — without them the script's credential-missing skip path silently disables uploads in CI.

#### Scenario: CI run uploads assets

- **WHEN** the workflow executes the update script
- **THEN** the run step's environment carries the `IMAGEKIT_*` secrets, so new assets upload instead of being silently skipped

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and the update script produces a diff
- **THEN** it commits the changes to a dated branch and opens a PR against `main`

#### Scenario: Weekly run with no changes

- **WHEN** the scheduled workflow runs and the update script produces no diff
- **THEN** no pull request is created
