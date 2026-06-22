## MODIFIED Requirements

### Requirement: Cartridge equipment

The system SHALL track an equipped cartridge per character with five fields: cartridge ID (string or null, references a named entry from `ALL_CARTRIDGES`), rarity (B, A, or S, or null), level (integer 0–20), main stat (string or null), and sub stats (array of strings, max 4). Defaults on add: all fields null/0/empty.

#### Scenario: Cartridge named set selected

- **WHEN** user selects a named cartridge set by name (e.g. "Lost Radiance")
- **THEN** the name picker updates UI state; a rarity must also be selected to form a valid `cartridgeId`

#### Scenario: Cartridge rarity selected

- **WHEN** user selects a rarity (B, A, or S) after selecting a set name
- **THEN** `cartridgeId` is set to the combined `{base}_{quality}` ID (e.g. `"Cosmos_orange"` for Lost Radiance S), `cartridgeRarity` is updated, and both are queued for DB write

#### Scenario: Cartridge cleared

- **WHEN** user un-equips the cartridge
- **THEN** `cartridgeId` is set to null, `cartridgeRarity` is set to null, `cartridgeMainStat` is set to null, `cartridgeSubStats` is set to empty array, and `cartridgeLevel` is set to 0

#### Scenario: Cartridge level updated

- **WHEN** user sets cartridge level to a value between 0 and 20
- **THEN** `cartridgeLevel` is updated in local state and queued for DB write, clamped to 0–20

#### Scenario: Cartridge main stat set

- **WHEN** user selects a main stat for the cartridge
- **THEN** `cartridgeMainStat` is updated in local state and queued for DB write

#### Scenario: Cartridge sub stats updated

- **WHEN** user sets sub stats (up to 4 entries)
- **THEN** `cartridgeSubStats` array is updated in local state and queued for DB write

### Requirement: Cartridge preferences

The system SHALL track cartridge build preferences per character with four fields: target cartridge ID (string or null, a single named set preference), main stats chain (ordered array of StatPreference), sub stats chain (ordered array of StatPreference), and comments (string or empty). Preferences are persisted via non-atomic delete-then-reinsert (see shared-save-behaviour spec known limitation).

#### Scenario: Target cartridge set preference saved

- **WHEN** user selects a preferred named cartridge set by name in the preferences tab
- **THEN** `cartridgePreferences.cartridgeId` is immediately set to the S-rarity ID for that set (e.g. selecting "Lost Radiance" saves `"LostRadiance_orange"`) and persisted; no rarity picker is shown because preferences always target S tier

#### Scenario: Target cartridge preference cleared

- **WHEN** user clears the cartridge preference picker
- **THEN** `cartridgePreferences.cartridgeId` is set to null

#### Scenario: Cartridge preferences saved

- **WHEN** user saves cartridge preferences with main and/or sub stat chains
- **THEN** all existing preference rows for the character are deleted, then new rows are inserted in order

#### Scenario: Empty preferences

- **WHEN** no cartridge preferences are set for a character
- **THEN** main stats and sub stats chains are empty arrays, cartridgeId is null; cartridge score returns -1

#### Scenario: Preference comments saved

- **WHEN** user enters comments in the cartridge preferences editor
- **THEN** comments string is persisted with the preference rows
