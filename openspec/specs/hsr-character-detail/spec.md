## Purpose

Honkai: Star Rail per-character tracked fields. Covers level, traces, 6 relic slots, build preference chains (main stat and sub-stat priority), and the stat preference chain structure shared with other games.

## Requirements

### Requirement: Character level field
The system SHALL track a character's level as an integer in the range 1–80, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range
- **WHEN** user sets a character's level to a value between 1 and 80 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum
- **WHEN** user sets a character's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum
- **WHEN** user sets a character's level above 80
- **THEN** level is clamped to 80 before update

### Requirement: Traces attained toggle
The system SHALL track whether a character's traces (skill upgrades) have been fully attained as a boolean, defaulting to false on add.

#### Scenario: Traces toggled on
- **WHEN** user toggles traces to true
- **THEN** `tracesAttained` is set to true in local state and queued for DB write

#### Scenario: Traces toggled off
- **WHEN** user toggles traces to false
- **THEN** `tracesAttained` is set to false in local state and queued for DB write

### Requirement: Six relic slots
The system SHALL track one equipped relic per slot across six named slots: head, hands, body, feet, sphere, rope. Each slot defaults to null (empty) on character add.

#### Scenario: Relic saved to slot
- **WHEN** user saves relic data to a slot
- **THEN** slot is updated optimistically in local state and a debounced upsert is queued for that slot

#### Scenario: Relic cleared from slot
- **WHEN** user removes the relic from a slot
- **THEN** slot is set to an empty relic (`{ setId: null, mainStat: null, subStats: [] }`) in local state and a debounced delete is queued

#### Scenario: Relic structure
- **WHEN** a relic is equipped in any slot
- **THEN** it contains: `setId` (string or null), `mainStat` (string or null), `subStats` (array of `{ type: string, value: string }`)

### Requirement: Build preferences — main stat chains
The system SHALL track ordered stat preference chains for the four variable main-stat slots: body, feet, sphere, rope. Head and hands have fixed main stats and SHALL NOT have preference chains.

#### Scenario: Main stat preference saved
- **WHEN** user saves build preferences with main stat chains for body, feet, sphere, or rope
- **THEN** each chain is an ordered array of `StatPreference` entries persisted via non-atomic delete-then-reinsert (see save-behaviour spec)

#### Scenario: Empty main stat chain
- **WHEN** no preferences are set for a variable slot
- **THEN** the chain is an empty array; the slot scores 0 for main stat match in relic scoring

### Requirement: Build preferences — sub-stat chain
The system SHALL track an ordered sub-stat preference chain shared across all relic slots for a character.

#### Scenario: Sub-stat preferences saved
- **WHEN** user saves a sub-stat preference chain
- **THEN** chain is an ordered array of `StatPreference` entries persisted alongside main stat chains

#### Scenario: Empty sub-stat chain
- **WHEN** no sub-stat preferences are set
- **THEN** sub-stat score is 0 for all slots in relic scoring

### Requirement: Build preferences — comments
The system SHALL support an optional free-text comments field on build preferences.

#### Scenario: Comments saved
- **WHEN** user enters comments in the build preferences editor
- **THEN** comments string is persisted with the preference rows

#### Scenario: No comments
- **WHEN** no comments are entered
- **THEN** comments field is undefined or absent

### Requirement: Stat preference chain structure
The system SHALL represent each entry in a stat preference chain as a `StatPreference` with three fields: `stat` (string), `operator` (string or null), and `orderIndex` (integer).

#### Scenario: Chain ordering
- **WHEN** multiple preferences exist in a chain
- **THEN** entries are ordered by `orderIndex` ascending, with lower index = higher priority

### Requirement: HSR roster sort by score
The system SHALL support sorting the HSR roster by calculated relic score (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by score selected
- **WHEN** user selects score sort
- **THEN** roster is ordered by `calculateRelicScore(character)` descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected
- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no score comparator
