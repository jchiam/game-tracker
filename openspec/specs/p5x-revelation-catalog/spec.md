## Purpose

Static catalog of Persona 5: The Phantom X Revelation Card sets, per-slot main stat
pools, shared substat pool, slot identifiers, and card rarity tiers. Provides the
reference data consumed by the revelation tracking and preference systems.

## Requirements

### Requirement: Heavens set catalog

The system SHALL maintain a static catalog of all Heavens Revelation Card sets. Each set entry SHALL include: `id` (kebab-case string), `name` (display string), `twoSetEffect` (string description), and `fourSetEffect` (string description). The catalog SHALL be exported as `ALL_HEAVENS_SETS`.

#### Scenario: Catalog contains all known sets

- **WHEN** the catalog is loaded
- **THEN** it contains at least 12 Heavens sets (Abundance, Science, Completion, Dominion, Peace, Interference, Valor, Strife, Love, Luxury, Power, Victory)

#### Scenario: Each set has both effects described

- **WHEN** a set entry is read
- **THEN** both `twoSetEffect` and `fourSetEffect` are non-empty strings

### Requirement: Space set catalog

The system SHALL maintain a static catalog of all Space Revelation Card sets. Each set entry SHALL include: `id` (kebab-case string), `name` (display string), and `effect` (string description). The catalog SHALL be exported as `ALL_SPACE_SETS`.

#### Scenario: Catalog contains all known sets

- **WHEN** the catalog is loaded
- **THEN** it contains at least 8 Space sets (Acceptance, Awareness, Departure, Faith, Growth, Harmony, Meditation, Trust)

### Requirement: Per-slot main stat pool

The system SHALL export a `MAIN_STATS` object mapping each slot to its valid main stat options:

- `SUN`: `['HP']` (fixed)
- `MOON`: `['ATK%', 'DEF%', 'HP%', 'HP Recovery%', 'DMG Multiplier%']`
- `STAR`: `['ATK%', 'DEF%', 'HP%', 'Crit Rate%', 'Crit Multiplier%', 'Ailment Accuracy%']`
- `SKY`: `['ATK%', 'DEF%', 'HP%', 'Speed', 'SP Recovery%']`
- `SPACE`: `['ATK & DEF']` (fixed dual stat)

Flat stat options SHALL be labeled by bare stat name (`ATK`, `HP`, `DEF`) with no `Flat` prefix; only percent variants carry a `%` suffix.

#### Scenario: Sun slot has fixed main stat

- **WHEN** the Sun slot main stat pool is queried
- **THEN** only `'HP'` is available

#### Scenario: Star slot has most options

- **WHEN** the Star slot main stat pool is queried
- **THEN** 6 options are available (ATK%, DEF%, HP%, Crit Rate%, Crit Multiplier%, Ailment Accuracy%)

#### Scenario: Space slot has fixed dual stat

- **WHEN** the Space slot main stat pool is queried
- **THEN** only `'ATK & DEF'` is available

#### Scenario: Flat main stats carry no prefix

- **WHEN** any main stat pool is queried
- **THEN** no option string begins with `'Flat '`

### Requirement: Shared substat pool

The system SHALL export a `SUB_STATS` array containing all valid substat types: ATK, ATK%, DEF, DEF%, HP, HP%, DMG Multiplier%, Ailment Accuracy%, Crit Rate%, Crit Multiplier%, Speed, SP Recovery%, Pierce Rate%.

Flat substats SHALL be labeled by bare stat name (`ATK`, `DEF`, `HP`) with no `Flat` prefix; percent substats retain the `%` suffix, keeping flat and percent variants distinct.

#### Scenario: Substat pool completeness

- **WHEN** the substat pool is queried
- **THEN** it contains exactly 13 stat types

#### Scenario: Flat substats carry no prefix

- **WHEN** the substat pool is queried
- **THEN** it contains `'ATK'`, `'DEF'`, and `'HP'` and no entry begins with `'Flat '`

### Requirement: Revelation slot identifiers

The system SHALL export a `REVELATION_SLOTS` array: `['sun', 'moon', 'star', 'sky', 'space']` and a type union `RevelationSlot` for type safety. Heavens slots SHALL be identified as the first four; Space is the fifth.

#### Scenario: Slot ordering

- **WHEN** the slots array is iterated
- **THEN** order is sun, moon, star, sky, space

### Requirement: Card rarity tiers

The system SHALL export a `CARD_RARITIES` array defining the quality tiers: `common` (gray, 2 substats), `rare` (blue, 3 substats), `epic` (purple, 4 substats), `legendary` (orange, 4 substats). Each entry includes `id`, `label`, `color`, and `maxSubStats`.

#### Scenario: Rarity determines substat count

- **WHEN** a card of `epic` rarity is created
- **THEN** it supports up to 4 substats
