# czn-data-pipeline Specification

## Purpose

Automated update pipeline for Chaos Zero Nightmare catalog data: fetches Prydwen's combatant page-data, filters placeholder entries, merges the hand-curated overlay seed, regenerates the combatant catalog file, seeds portraits to ImageKit, and runs weekly via GitHub Actions with an auto-PR on changes. Structured so Phase 2 adds the Partner catalog from the sibling page-data.

## Requirements

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

### Requirement: Placeholder entries excluded

The script SHALL exclude list nodes whose `class` or `element` is `Unknown` (Prydwen's teaser placeholders for unreleased combatants) from the generated catalog rather than emitting them with placeholder taxonomy.

#### Scenario: Teaser node dropped

- **WHEN** the list page-data contains a node with `class: "Unknown"` (e.g. a pre-release teaser)
- **THEN** that node is absent from `combatants.ts` and is reported in the run output as excluded

#### Scenario: Teaser node later released

- **WHEN** a previously excluded node gains a real `class` and `element` in a later run
- **THEN** it appears in the regenerated catalog and the diff reports it as `added`

#### Scenario: Teaser node covered by the overlay seed

- **WHEN** the list page-data contains a placeholder node whose slug also appears in the overlay seed (the unit has released but Prydwen has not updated the node)
- **THEN** the seed entry is emitted in its place, the run reports the placeholder as covered by the seed, and once the node gains real taxonomy the fetched entry wins and the run warns that the seed entry is shadowed rather than reporting it as `added`

### Requirement: Portrait URLs derived per run

The script SHALL resolve each fetched combatant's portrait download URL from the freshly fetched detail page-data image node (`cardImage`, falling back to `smallImage`), never from a hardcoded hashed path, because Prydwen's `/static/` paths change per site build. Overlay entries SHALL use their `imageSource`.

#### Scenario: Image URL taken from current page-data

- **WHEN** a combatant's detail page-data carries a `cardImage` node
- **THEN** the download URL is that node's fallback `src` resolved against the Prydwen origin, and the asset is uploaded at the path matching the entry's `imageUrl`

#### Scenario: No image node

- **WHEN** a combatant's detail page-data carries neither `cardImage` nor `smallImage`, or an overlay entry's `imageSource` is `null`
- **THEN** the entry is still emitted to the catalog and its portrait is counted as missing in the run output

### Requirement: Weekly CZN update workflow

The system SHALL provide `.github/workflows/update-czn-data.yml` running the update script on a weekly cron plus manual dispatch. When the script produces file changes, the workflow SHALL auto-create a pull request with the diff, titled and described as a CZN data update covering combatants and partners; when nothing changed, no PR is created.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and a regenerated catalog differs from the committed one
- **THEN** a PR is opened containing the regenerated data file changes

#### Scenario: Weekly run without changes

- **WHEN** the scheduled workflow runs and no files change
- **THEN** no PR is created

### Requirement: Combatant catalog is generated, not hand-authored

`src/data/chaos-zero-nightmare/combatants.ts` SHALL be produced exclusively by the update script and SHALL never be hand-edited, per the repo-wide `src/data` rule. Corrections go into the script's mapping or the overlay seed.

#### Scenario: Catalog change needed

- **WHEN** a combatant's catalog data is wrong or missing
- **THEN** the fix is made in `scripts/update-czn-data.mjs` or `scripts/seeds/czn-combatants.json` and the file regenerated — never by editing `combatants.ts` directly

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
