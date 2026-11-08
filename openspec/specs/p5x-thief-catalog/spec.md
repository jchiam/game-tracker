## Purpose

Generated catalog of Persona 5: The Phantom X (P5X) Thieves, consumed at runtime via
`ALL_THIEVES`. P5X has a structured community data
source — Prydwen's Gatsby page-data JSON endpoints (also consumed by the AE pipeline) — so the catalog follows the
HSR/R1999 model: an automated update script regenerates the data file and seeds
portraits to ImageKit, and a weekly GitHub Actions workflow auto-creates a PR when
the source changes.

## Requirements

### Requirement: Thief catalog data file

The system SHALL maintain a static catalog of P5X Thieves in
`src/data/persona-5-phantom-x/thieves.ts`, exporting a `P5xThief` interface and a
`const ALL_THIEVES: P5xThief[]`. The file is **generated** by
`scripts/update-p5x-data.mjs` and SHALL carry the standard generated-file banner —
never hand-edited (per the repo-wide `src/data` rule).

Each entry SHALL have the fields: `id` (string, Prydwen slug, e.g. `ann-takamaki`),
`name` (string, display name), `codename` (string, e.g. `Panther`), `personaName`
(string, the bound Persona's display name, e.g. `Carmen`), `rarity` (`4 | 5`),
`role` (string — Prydwen's job value verbatim, e.g. `Single-target`, `Navigator`,
`Virtuoso`), `element` (string, e.g. `Fire`, `Psychokinesis`, `Gun`), and `imageUrl`
(string, local path `/assets/persona-5-phantom-x/thieves/{id}.webp`).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_THIEVES` from `@/data/persona-5-phantom-x/thieves`
- **THEN** the full array of `P5xThief` entries is available with `id`, `name`, `codename`, `personaName`, `rarity`, `role`, `element`, and `imageUrl` fields

#### Scenario: Source taxonomy stored verbatim

- **WHEN** the update script maps a Prydwen character
- **THEN** `role` and `element` carry the source values unmodified (no rename to in-game role names), so new source vocabulary is data, not a code change

#### Scenario: Variant units are separate entries

- **WHEN** the source lists multiple variants of the same character (e.g. Tomoko and Seaside Tomoko)
- **THEN** each variant is a distinct catalog entry with its own `id`, and no variant-linking field exists

### Requirement: Automated catalog update script

The system SHALL provide `scripts/update-p5x-data.mjs`, composing the shared
`scripts/lib/pipeline.mjs` plumbing (env loading, ImageKit init, `ensureAsset`,
`--reupload-*` flag parsing, `fetchJSON`/`downloadImage`, catalog diffing, `validateOverlaySeed`,
`applyOverlay`, generated-file banner), that:

1. Fetches the character-list page-data JSON from the Prydwen CloudFront origin
   (`/page-data/persona-5x/characters/page-data.json`) and loads and validates the overlay seed.
2. Fetches each character's detail page-data
   (`/page-data/persona-5x/characters/{slug}/page-data.json`) to obtain
   `personaName` and the embedded hashed image paths.
3. Merges the overlay seed after the fetched list with `applyOverlay`, keyed on `id`; the fetched
   entry wins a collision and the run warns naming the shadowed seed entry.
4. Resolves each portrait's download URL — from the freshly fetched JSON (never a
   hardcoded hashed path) for fetched entries, from `imageSource` for seed entries — downloads
   it, and uploads via `ensureAsset` to ImageKit at the path matching the entry's `imageUrl`.
5. Regenerates `thieves.ts` and prints a catalog diff (`added` / `removed`), the overlay count,
   plus per-asset `skipped` / `uploaded` / `failed` counts.

The script SHALL be idempotent: reruns skip already-uploaded assets unless a
`--reupload-*` flag is passed. A fetch, parse, or seed-validation failure SHALL exit non-zero
without writing a partial catalog.

#### Scenario: Fresh run regenerates catalog

- **WHEN** the update script runs against the live source
- **THEN** `thieves.ts` is regenerated with all source units and overlay entries mapped to `P5xThief` entries and a diff summary is printed

#### Scenario: Idempotent image handling

- **WHEN** the script runs and a portrait already exists in ImageKit
- **THEN** that asset is skipped and counted as `skipped`, and no upload occurs

#### Scenario: Image URLs derived per run

- **WHEN** Prydwen redeploys and its hashed `/static/...` image paths change
- **THEN** the next script run still downloads images successfully because URLs are parsed from the current page-data JSON

#### Scenario: Source failure fails loudly

- **WHEN** the list endpoint is unreachable or its JSON shape is missing expected fields
- **THEN** the script exits non-zero and `thieves.ts` is left unchanged

### Requirement: Weekly update workflow

The system SHALL provide `.github/workflows/update-p5x-data.yml` running the update
script on a weekly cron plus manual `workflow_dispatch`, auto-creating a PR when the
generated catalog changes — matching the existing per-game update workflows.

#### Scenario: Weekly run with changes

- **WHEN** the scheduled workflow runs and the script produces a modified `thieves.ts`
- **THEN** a PR is opened containing the regenerated catalog for review

#### Scenario: Weekly run without changes

- **WHEN** the scheduled workflow runs and the catalog is unchanged
- **THEN** no PR is created

#### Scenario: Script failure surfaces in CI

- **WHEN** the update script exits non-zero (source schema drift, network failure)
- **THEN** the workflow run is marked failed and no PR is created

### Requirement: Overlay seed for thieves the source lacks

The system SHALL maintain a hand-curated overlay seed at `scripts/seeds/p5x-thieves.json`: a JSON
array of thieves the Prydwen source does not list. Each entry SHALL carry the `P5xThief` fields
`id`, `name`, `codename`, `personaName`, `rarity` (`4 | 5`), `role`, `element`, plus `imageSource`
(an https URL for the card art, or `null` while none is sourced) and MAY carry a free-text `note`.
An entry's `id` SHALL be the slug the source will assign the unit, so tracked rows keyed on it
survive the hand-off. `role` and `element` SHALL use the source's vocabulary as already present in
the generated catalog. The seed is edited by hand in a normal PR; the generated catalog never is.

#### Scenario: Seed entry reaches the catalog

- **WHEN** the update script runs with a seed entry whose `id` is absent from the fetched list
- **THEN** `thieves.ts` contains that entry with `imageUrl` `/assets/persona-5-phantom-x/thieves/{id}.webp`, sorted with the fetched entries by rarity then name

#### Scenario: Upstream catches up

- **WHEN** the fetched list contains a slug that is also a seed `id`
- **THEN** the fetched entry is emitted, the seed entry is ignored, and the run warns naming the seed entry to delete

#### Scenario: Seed image is uploaded like a fetched portrait

- **WHEN** a seed entry has an https `imageSource` and its portrait is missing from ImageKit
- **THEN** the script downloads it, resizes to 256×256, and uploads via `ensureAsset`; a `null` `imageSource` is warned and counted as a missing image

#### Scenario: Invalid seed fails loudly

- **WHEN** the seed is not an array, an entry lacks a required field, has a non-kebab-case or duplicate `id`, a rarity other than 4 or 5, or an `imageSource` that is neither an https URL nor `null`
- **THEN** the script exits non-zero before any codegen and `thieves.ts` is left unchanged
