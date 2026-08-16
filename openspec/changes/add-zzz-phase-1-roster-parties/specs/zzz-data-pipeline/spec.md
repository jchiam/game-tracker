## Purpose

Automated update pipeline for Zenless Zone Zero catalog data: fetches the Enka.Network store JSONs, resolves localized names, regenerates the agent catalog file, seeds portraits to ImageKit, and runs weekly via GitHub Actions with an auto-PR on changes. Structured so later phases extend it with Drive Disc and W-Engine catalogs.

## ADDED Requirements

### Requirement: Automated ZZZ update script

The system SHALL provide `scripts/update-zzz-data.mjs`, composed from the shared pipeline plumbing (`scripts/lib/pipeline.mjs`), that fetches ZZZ catalog data from the Enka.Network store (GitHub raw: `EnkaNetwork/API-docs` → `store/zzz/avatars.json`, `store/zzz/locs.json`), resolves agent display names from the English localization table, regenerates `src/data/zenless-zone-zero/agents.ts`, and uploads agent portraits to ImageKit under a `zenless_zone_zero` folder. The script SHALL be idempotent: already-uploaded assets are skipped unless a `--reupload-*` flag is passed, and per-asset loops drive counters off the shared `ensureAsset` result.

#### Scenario: Fresh run regenerates catalog

- **WHEN** the script runs against the live Enka store
- **THEN** `src/data/zenless-zone-zero/agents.ts` is regenerated with all released agents, carrying the generated-file banner, and a catalog diff (added/removed/changed entries) is printed

#### Scenario: Existing assets skipped

- **WHEN** the script runs and an agent portrait already exists in ImageKit
- **THEN** the upload is skipped and counted as skipped, unless the matching `--reupload-*` flag was passed

#### Scenario: Unreleased and non-playable entries excluded

- **WHEN** the Enka store contains beta/unreleased avatars or entries without a resolvable English display name
- **THEN** those entries are excluded from the generated catalog rather than emitted with placeholder names

### Requirement: Weekly ZZZ update workflow

The system SHALL provide `.github/workflows/update-zzz-data.yml` running the update script on a weekly cron plus manual dispatch. When the script produces file changes, the workflow SHALL auto-create a pull request with the diff; when nothing changed, no PR is created.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and the regenerated catalog differs from the committed one
- **THEN** a PR is opened containing the regenerated data file changes

#### Scenario: Weekly run without changes

- **WHEN** the scheduled workflow runs and no files change
- **THEN** no PR is created

### Requirement: Agent catalog is generated, not hand-authored

`src/data/zenless-zone-zero/agents.ts` SHALL be produced exclusively by the update script and SHALL never be hand-edited, per the repo-wide `src/data` rule.

#### Scenario: Catalog change needed

- **WHEN** an agent's catalog data is wrong or missing
- **THEN** the fix is made in `scripts/update-zzz-data.mjs` (or its source mapping) and the file regenerated — never by editing `agents.ts` directly

### Requirement: Pipeline extensibility for later phases

The script SHALL structure its fetch and codegen so that Phase 2 (Drive Disc suits from `store/zzz/equipments.json`) and Phase 3 (W-Engines from `store/zzz/weapons.json`) add new catalog emitters without restructuring the agent path.

#### Scenario: Later phase adds a catalog

- **WHEN** a later phase adds W-Engine or Drive Disc catalog generation
- **THEN** the addition is a new fetch + map + emit section reusing the same loc resolution and `ensureAsset` plumbing, and the agent codegen path is unchanged
