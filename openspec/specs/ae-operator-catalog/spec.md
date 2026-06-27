## Purpose

Static catalog of Arknights: Endfield operators, consumed at runtime via `ALL_OPERATORS`.
Unlike the other games, AE has **no stable structured data source**, so the catalog is
**hand-authored** and operator portraits are seeded by a one-shot script rather than a
weekly automated pipeline. This spec documents how the manual dataset is crafted and
updated so it can be reproduced on each game patch. Automating this is tracked as tech
debt by the `add-ae-data-pipeline` change, which will supersede the manual procedure once
a structured source exists.

## Requirements

### Requirement: Operator catalog data file

The system SHALL maintain a static catalog of AE operators in
`src/data/arknights-endfield/operators.ts`, exporting an `EndfieldOperator` interface and a
`const ALL_OPERATORS: EndfieldOperator[]`. The file is hand-authored (the only `src/data`
catalog that is) and its header SHALL state that it is manually maintained.

Each entry SHALL have the fields: `id` (string, kebab-case slug, e.g. `chen-qianyu`),
`name` (string, display name), `rarity` (`4 | 5 | 6`), `class` (string, e.g. `Guard`),
`element` (string, e.g. `Heat`), `weapon` (string, e.g. `Greatsword`), and `imageUrl`
(string, local path `/assets/arknights-endfield/operators/{id}.webp`).

#### Scenario: Catalog accessible at runtime

- **WHEN** any component imports `ALL_OPERATORS` from `@/data/arknights-endfield/operators`
- **THEN** the full array of `EndfieldOperator` entries is available with `id`, `name`, `rarity`, `class`, `element`, `weapon`, and `imageUrl` fields

#### Scenario: Entries grouped by rarity

- **WHEN** the catalog is authored or edited
- **THEN** entries are grouped 6★ → 5★ → 4★ with a comment banner per group, matching the existing file layout

### Requirement: Manual catalog maintenance procedure

The system SHALL support updating the AE catalog by hand using a documented, repeatable
procedure, because no structured AE data source exists yet. To add or update an operator,
a maintainer SHALL:

1. Source the operator's attributes (rarity, class, element, weapon) from a community
   Endfield database (e.g. endfield.gg, game8, icy-veins) — there is no canonical API.
2. Choose a kebab-case `id` matching the slug used by the portrait source (prydwen.gg).
3. Add or edit the entry in `ALL_OPERATORS` in `operators.ts`, in the correct rarity group,
   with `imageUrl` set to `/assets/arknights-endfield/operators/{id}.webp`.
4. Add the same `id` to the `OPERATORS` array in `scripts/seed-ae-images.mjs`.
5. Run `node scripts/seed-ae-images.mjs` to fetch and upload the portrait.

#### Scenario: Adding a new operator

- **WHEN** a new operator ships in a game patch
- **THEN** the maintainer adds the entry to `ALL_OPERATORS` and the `id` to the seed script's `OPERATORS` array, then runs the seed script to upload the portrait

#### Scenario: Attribute correction with no image change

- **WHEN** only an operator's attributes (class/element/weapon/rarity) change
- **THEN** editing the entry in `operators.ts` is sufficient; re-running the seed script is not required because the portrait already exists on ImageKit

### Requirement: Operator portrait seeding

The system SHALL provide `scripts/seed-ae-images.mjs`, a one-shot, idempotent script that
downloads each operator portrait from prydwen.gg and uploads it to ImageKit at
`/arknights_endfield/operators/{id}.webp`, resized to a 256×256 cover-fit webp. The set of
operators SHALL be the hardcoded `OPERATORS` id array in the script, kept in sync with
`ALL_OPERATORS`.

#### Scenario: New portrait uploaded

- **WHEN** the seed script runs and an operator portrait is not yet on ImageKit
- **THEN** the portrait is downloaded from prydwen.gg, resized to 256×256 webp, and uploaded to `/arknights_endfield/operators/{id}.webp`

#### Scenario: Existing portrait skipped

- **WHEN** the seed script runs and an operator portrait already exists on ImageKit
- **THEN** the upload is skipped, unless `--reupload` is passed to force re-upload of all portraits

#### Scenario: ImageKit not configured

- **WHEN** `IMAGEKIT_PRIVATE_KEY` is not set
- **THEN** the seed script exits early with an error message and uploads nothing
