# zzz-disc-catalog Specification

## Purpose

Generated catalog of Zenless Zone Zero Drive Disc suits, consumed at runtime via `ALL_ZZZ_DISC_SUITS`, plus the hand-curated suit short-name map, the single-sourced disc slot stat-pool model, and suit icon URL resolution through ImageKit.

## Requirements

### Requirement: Generated Drive Disc suit catalog

The system SHALL provide a generated catalog module `src/data/zenless-zone-zero/disc_suits.ts` exporting `ZzzDiscSuit { id: string; name: string; icon: string }` and `ALL_ZZZ_DISC_SUITS: ZzzDiscSuit[]`, sorted alphabetically by name, carrying the generated-file banner, with icons referenced as local asset paths (`/assets/zenless-zone-zero/disc-suits/{id}.png`). The file SHALL be produced exclusively by the update script, never hand-edited.

#### Scenario: Catalog covers released suits

- **WHEN** the update script runs against the live Enka store
- **THEN** every suit in `equipments.json` `Suits` with a resolvable English name is emitted; entries without a resolvable name are excluded

#### Scenario: Hand-edit prohibited

- **WHEN** a suit's catalog data is wrong or missing
- **THEN** the fix is made in the update script and the file regenerated — never by editing `disc_suits.ts` directly

### Requirement: Hand-curated suit short names

The system SHALL provide a hand-curated `src/data/zenless-zone-zero/disc_suit_short_names.ts` mapping suit id to a one-word card label, mirroring the HSR relic short-name module. The update script SHALL NOT write this file. Consumers SHALL fall back to the full suit name when a suit id has no short-name entry.

#### Scenario: Short name used on card

- **WHEN** the agent card renders the suit digest line for a suit with a short-name entry
- **THEN** the one-word label is shown instead of the full suit name

#### Scenario: Uncurated suit falls back

- **WHEN** a newly released suit has no short-name entry yet
- **THEN** the full suit name is shown and nothing breaks

### Requirement: Disc suit stat pools are single-sourced

The disc slot model — fixed main stats for slots 1–3 (HP, ATK, DEF), variable main-stat pools for slots 4–6, and the shared substat pool — SHALL be declared once in `src/data/zenless-zone-zero/discs.ts` and imported by both the disc editor and the scoring adapter. Neither consumer SHALL re-declare the pools.

#### Scenario: Editor and scorer agree

- **WHEN** a stat is added to a slot pool in `discs.ts`
- **THEN** the editor's main-stat select and the scorer's achievable-substat pool both reflect it without further edits

### Requirement: Suit icon resolution

`src/lib/imagekit.ts` SHALL provide `getZzzDiscSuitIconUrl` resolving a suit's local icon path to an ImageKit URL with a width transform, falling back to the local path when ImageKit is not configured.

#### Scenario: Configured endpoint

- **WHEN** the ImageKit endpoint env var is set
- **THEN** the function returns the CDN URL with the transform applied

#### Scenario: Unconfigured endpoint

- **WHEN** the endpoint env var is absent
- **THEN** the function returns the local asset path unchanged
