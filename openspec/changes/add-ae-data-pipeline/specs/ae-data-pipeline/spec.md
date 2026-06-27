## ADDED Requirements

### Requirement: Automated AE update script

The system SHALL provide `scripts/update-ae-data.mjs` that regenerates the Arknights:
Endfield operator catalog and uploads operator portraits to ImageKit in a single run,
following the per-game update-script pattern (`update-hsr-data.mjs`, `update-n2e-data.mjs`,
`update-r1999-data.mjs`). The script SHALL reuse the existing ImageKit client init and
`IMAGEKIT_*` env fallback chain.

#### Scenario: Catalog regenerated from source

- **WHEN** the update script runs against the external AE data source
- **THEN** `src/data/arknights-endfield/operators.ts` is rewritten with the auto-generated banner and a complete `ALL_OPERATORS` array (id, name, rarity, class, element, weapon, imageUrl)

#### Scenario: New portrait uploaded

- **WHEN** the update script runs and an operator portrait is not yet on ImageKit
- **THEN** the portrait is uploaded to `/arknights_endfield/operators/{id}.webp`

#### Scenario: Existing portrait skipped

- **WHEN** the update script runs and an operator portrait already exists on ImageKit
- **THEN** the upload is skipped (idempotent), unless a `--reupload-*` flag is passed

#### Scenario: Local path unchanged

- **WHEN** the update script regenerates the catalog
- **THEN** `operators.ts` continues to store local paths (`/assets/arknights-endfield/operators/{id}.webp`)

### Requirement: Weekly AE update workflow

The system SHALL provide `.github/workflows/update-ae-data.yml` that runs the update
script on a weekly cron and on manual dispatch, then opens an auto-PR when generated
files change — mirroring the other games' update workflows.

#### Scenario: Scheduled run with changes

- **WHEN** the workflow runs and the update script produces a diff
- **THEN** the workflow commits to a `chore/update-ae-data-<date>` branch and opens a PR against `main`

#### Scenario: Scheduled run with no changes

- **WHEN** the workflow runs and the update script produces no diff
- **THEN** no branch or PR is created

### Requirement: Operator catalog is generated, not hand-authored

Once the update script exists, `src/data/arknights-endfield/operators.ts` SHALL carry the
auto-generated banner used by the other catalogs ("do not edit manually — run the script")
and SHALL NOT be edited by hand.

#### Scenario: Generated banner present

- **WHEN** the update script regenerates the catalog
- **THEN** the file header instructs maintainers to run `scripts/update-ae-data.mjs` rather than edit the file directly

### Requirement: One-shot seed script decommissioned

The system SHALL remove the one-shot `scripts/seed-ae-images.mjs` once
`scripts/update-ae-data.mjs` covers portrait upload, and SHALL update any
documentation references accordingly.

#### Scenario: Seed script removed

- **WHEN** the update script covers image upload
- **THEN** `scripts/seed-ae-images.mjs` no longer exists and docs reference `update-ae-data.mjs`
