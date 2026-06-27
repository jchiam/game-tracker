## ADDED Requirements

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

### Requirement: Weekly workflow runs the script and auto-PRs changes

Each game SHALL have a `.github/workflows/update-{game}-data.yml` that runs on a weekly `schedule`
cron and on manual `workflow_dispatch`, executes the update script, formats the result, and opens
a pull request only when the run produced changes.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and the update script produces a diff
- **THEN** it commits the changes to a dated branch and opens a PR against `main`

#### Scenario: Weekly run with no changes

- **WHEN** the scheduled workflow runs and the update script produces no diff
- **THEN** no pull request is created
