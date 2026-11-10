# czn-fragment-catalog Specification

## Purpose

Generated catalog of Chaos Zero Nightmare Memory Fragment sets consumed at runtime via `ALL_CZN_FRAGMENT_SETS`, plus the hand-curated set short-name map, the hand-maintained single-sourced slot and stat-pool model, set icon URL resolution through ImageKit, and the overlay seed for sets the source lacks.

## ADDED Requirements

### Requirement: Generated Memory Fragment set catalog

The system SHALL provide a generated catalog module `src/data/chaos-zero-nightmare/fragment_sets.ts` exporting `CznFragmentSet { id: string; name: string; pieces: 2 | 4; imageUrl: string }` and `ALL_CZN_FRAGMENT_SETS: CznFragmentSet[]`, sorted alphabetically by name, carrying the generated-file banner, with icons referenced as local asset paths (`/assets/chaos-zero-nightmare/fragment-sets/{id}.webp`). `id` SHALL be the kebab-case slug of the set's name, minted at generation; `pieces` SHALL be 4 for a 4-piece set and 2 for a 2-piece set. The file SHALL be produced exclusively by the update script and never hand-edited.

#### Scenario: Catalog covers source sets plus overlay

- **WHEN** the update script runs against the live Prydwen origin
- **THEN** every set in the source list is emitted with its minted id and piece count, followed by surviving overlay-seed entries, in one alphabetical list

#### Scenario: Unknown piece type aborts

- **WHEN** a source set carries a piece type other than the 2-piece or 4-piece markers
- **THEN** the run exits non-zero naming the set and the committed catalog is left unchanged

#### Scenario: Hand-edit prohibited

- **WHEN** a set's catalog data is wrong or missing
- **THEN** the fix is made in the update script or the set overlay seed and the file regenerated — never by editing `fragment_sets.ts` directly

### Requirement: Memory Fragment set overlay seed

The system SHALL provide `scripts/seeds/czn-fragment-sets.json` as the hand-curated overlay for sets the source lacks. Each entry SHALL carry `id`, `name`, `pieces`, an `imageSource` (https URL or `null`), and a free-text `note`. The run SHALL abort when an entry's `pieces` is not 2 or 4 or when its `id` is not the kebab-case slug of its `name`. Entries SHALL merge after the fetched list keyed on `id`; a fetched set with the same id wins and the run warns that the seed entry is shadowed.

#### Scenario: Seed id must be the name's slug

- **WHEN** a seed entry's `id` differs from the slug of its `name`
- **THEN** the run exits non-zero naming the entry and the expected slug before any catalog is written

#### Scenario: Seed entry shadowed by upstream

- **WHEN** a later run's fetched list contains a set whose minted id equals a seed entry's id
- **THEN** the fetched set is emitted, the seed entry is ignored, and the run warns that it should be deleted

### Requirement: Hand-curated set short names

The system SHALL provide a hand-curated `src/data/chaos-zero-nightmare/fragment_set_short_names.ts` mapping set id to a one-word card label. The update script SHALL NOT write this file. Consumers SHALL fall back to the full set name when a set id has no short-name entry.

#### Scenario: Short name used on card

- **WHEN** the combatant card renders the set digest for a set with a short-name entry
- **THEN** the one-word label is shown instead of the full set name

#### Scenario: Uncurated set falls back

- **WHEN** a newly released set has no short-name entry yet
- **THEN** the full set name is shown and nothing breaks

### Requirement: Memory Fragment slot model is single-sourced

The slot model — six slots numbered 1–6 named Shock, Suppression, Denial, Ideal, Desire, Imagination; fixed main stats `Flat ATK`, `Flat DEF`, `Flat HP` on slots 1–3; variable main-stat pools for slots 4–6 (slot 4: `ATK%`, `HP%`, `Critical Chance%`, `Critical Damage%`; slot 5: `ATK%`, `HP%`, `Passion Damage%`, `Justice Damage%`, `Order Damage%`, `Void Damage%`, `Instinct Damage%`; slot 6: `ATK%`, `DEF%`, `HP%`, `Ego Recovery`); and the shared substat pool (`Flat ATK`, `Flat DEF`, `Flat HP`, `ATK%`, `DEF%`, `HP%`, `Critical Chance%`, `Critical Damage%`, `Ego Recovery`, `Extra Damage%`, `Damage over Time%`) — SHALL be declared once in a hand-maintained `src/data/chaos-zero-nightmare/fragments.ts` and imported by both the fragment editor and the scoring adapter. Neither consumer SHALL re-declare the pools. The file's header SHALL state that it is game knowledge maintained by hand, not generated.

#### Scenario: Editor and scorer agree

- **WHEN** a stat is added to a slot pool in `fragments.ts`
- **THEN** the editor's main-stat select and the scorer's achievable-substat pool both reflect it without further edits

#### Scenario: Slot name shown with its numeral

- **WHEN** the editor renders the slot card for slot 4
- **THEN** its header reads the Roman numeral and the slot name together (`IV · Ideal`)

### Requirement: Set icon resolution

`src/lib/imagekit.ts` SHALL provide `getCznFragmentSetIconUrl` resolving a set's local icon path to an ImageKit URL with a width transform, falling back to the local path when ImageKit is not configured.

#### Scenario: Configured endpoint

- **WHEN** the ImageKit endpoint env var is set
- **THEN** the function returns the CDN URL with the transform applied

#### Scenario: Unconfigured endpoint

- **WHEN** the endpoint env var is absent
- **THEN** the function returns the local asset path unchanged
