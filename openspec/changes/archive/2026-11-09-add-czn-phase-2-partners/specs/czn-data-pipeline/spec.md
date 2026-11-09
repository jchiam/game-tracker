# Spec Delta

## MODIFIED Requirements

### Requirement: Automated CZN update script

The system SHALL provide `scripts/update-czn-data.mjs`, composed from the shared pipeline plumbing, that fetches the Prydwen combatant list and detail page-data and the Prydwen partners page-data from the CloudFront origin, merges each overlay seed, regenerates `src/data/chaos-zero-nightmare/combatants.ts` and `partners.ts`, and uploads combatant portraits to ImageKit `chaos_zero_nightmare/combatants` and partner icons to `chaos_zero_nightmare/partners`. The script SHALL be idempotent: already-uploaded assets are skipped unless a `--reupload-*` flag is passed. A fetch, parse, or seed-validation failure SHALL exit non-zero without writing a partial catalog.

#### Scenario: Fresh run regenerates catalog

- **WHEN** the script runs against the live Prydwen origin
- **THEN** `combatants.ts` and `partners.ts` are regenerated with every released source entry plus surviving overlay entries, carrying the generated-file banner, and for each catalog a diff (`added` / `removed`), the overlay count, and per-asset `skipped` / `uploaded` / `failed` counts are printed

#### Scenario: Existing assets skipped

- **WHEN** the script runs and a combatant portrait or partner icon already exists in ImageKit
- **THEN** the upload is skipped and counted as `skipped`, unless the matching `--reupload-combatants` / `--reupload-partners` flag or `--reupload-all` was passed

#### Scenario: Source shape drift fails loudly

- **WHEN** the list page-data lacks `allCharacters.nodes`, a detail page-data lacks `currentUnit`, or the partners static query lacks `allContentfulChaosPartner.nodes`
- **THEN** the script exits non-zero naming the slug or endpoint, and the committed catalogs are left unchanged

### Requirement: Weekly CZN update workflow

The system SHALL provide `.github/workflows/update-czn-data.yml` running the update script on a weekly cron plus manual dispatch. When the script produces file changes, the workflow SHALL auto-create a pull request with the diff, titled and described as a CZN data update covering combatants and partners; when nothing changed, no PR is created.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and a regenerated catalog differs from the committed one
- **THEN** a PR is opened containing the regenerated data file changes

#### Scenario: Weekly run without changes

- **WHEN** the scheduled workflow runs and no files change
- **THEN** no PR is created

## REMOVED Requirements

### Requirement: Pipeline extensibility for Partners

**Reason**: Fulfilled by this change — the Partner emitter now exists, so the placeholder contract is replaced by the concrete requirement below.
**Migration**: None; the combatant codegen path is unchanged and the partner path is specified by "Partner catalog resolved through the page's static query".

## ADDED Requirements

### Requirement: Partner catalog resolved through the page's static query

The script SHALL read the partners page-data (`/page-data/chaos-zero-nightmare/partners/page-data.json`) for its `staticQueryHashes`, fetch each `/page-data/sq/d/<hash>.json`, and take Partner nodes from the one carrying `allContentfulChaosPartner.nodes`. The hash SHALL be resolved per run, never hardcoded, because it changes per site build. Each node maps `name`, `rarity`, `class`, `faction` into `CznPartner`; `imageUrl` derives from the node's `smallImage` fallback `src` resolved against the origin.

#### Scenario: Static query located per run

- **WHEN** the partners page-data lists one or more static query hashes
- **THEN** the script fetches them and uses the first whose payload carries `allContentfulChaosPartner.nodes`, aborting non-zero if none does

#### Scenario: Partner icon URL taken from current static query

- **WHEN** a Partner node carries a `smallImage` node
- **THEN** the download URL is that node's fallback `src` resolved against the Prydwen origin, uploaded as webp at source size to the path matching the entry's `imageUrl`

#### Scenario: Partner without an image

- **WHEN** a Partner node carries no `smallImage`, or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted and its icon is counted as missing in the run output
