## Purpose

Neverness to Everness per-character tracked fields. Covers level (1–90), awakening (6 boolean slots), arc equipment (id + level + tier), cartridge equipment (cartridgeId + rarity + level + main stat + sub stats), cartridge build preferences (target cartridgeId + main/sub chains + comments), favorite toggle, level-based sort, search keys, and card collapse composition.

## Requirements

### Requirement: Character level field

The system SHALL track a character's level as an integer in the range 1–90, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets a character's level to a value between 1 and 90 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets a character's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets a character's level above 90
- **THEN** level is clamped to 90 before update

### Requirement: Awakening slots

The system SHALL track six boolean awakening slots per character, each defaulting to false on add. Each slot is toggled independently.

#### Scenario: Awakening slot toggled on

- **WHEN** user toggles awakening slot N (0–5) to true
- **THEN** that slot is set to true in local state and the full awakening array is queued for DB write

#### Scenario: Awakening slot toggled off

- **WHEN** user toggles awakening slot N (0–5) to false
- **THEN** that slot is set to false in local state and the full awakening array is queued for DB write

#### Scenario: Default awakening state

- **WHEN** a character is added to the roster
- **THEN** all six awakening slots are false

### Requirement: Arc equipment

The system SHALL track an equipped arc per character with three fields: arc ID (string or null), arc level (integer), and arc tier (integer 1–5). Defaults on add: arc ID null, arc level 1, arc tier 1.

#### Scenario: Arc equipped

- **WHEN** user selects an arc by ID
- **THEN** `arcId` is updated in local state and queued for DB write

#### Scenario: Arc unequipped

- **WHEN** user clears the arc selection
- **THEN** `arcId` is set to null (level and tier retain values but are not displayed)

#### Scenario: Arc level updated

- **WHEN** user sets arc level
- **THEN** `arcLevel` is updated in local state and queued for DB write

#### Scenario: Arc tier updated

- **WHEN** user sets arc tier to a value between 1 and 5
- **THEN** `arcTier` is updated in local state and queued for DB write, clamped to 1–5

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

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked character. Updates are optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a character
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: N2E roster sort by level

The system SHALL support sorting the N2E roster by character level (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the shared-roster spec is applied with no level comparator

### Requirement: N2E roster search keys

The system SHALL search the N2E roster using Fuse.js with keys: name, esperType, arcType, roles.

#### Scenario: Search by esper type

- **WHEN** user searches for an esper type name
- **THEN** characters matching that esper type are returned via fuzzy search

#### Scenario: Search by role

- **WHEN** user searches for a role name
- **THEN** characters with that role are returned via fuzzy search

### Requirement: N2E card collapsed summary composition

The N2E character card's collapsed summary (`.game-card-static-summary`) SHALL contain exactly two child blocks: a stat chips row and a one-line equipment digest. No editing affordances (buttons, clickable slots) SHALL appear in the collapsed summary.

#### Scenario: Stat chips row displays investment progress

- **WHEN** the card is in collapsed (non-editing) state
- **THEN** `.game-card-static-stats` renders `Lv {level}` and `A {awakeningCount}/6` chips colored by `getProgressStyle`, plus a conditional `Cart {score}%` chip (shown only when cartridge preferences exist and score >= 0, colored by `getProgressStyle(score, 0, 100)`)

#### Scenario: Equipment one-liner shows arc and cartridge digest

- **WHEN** the card is in collapsed state and arc and/or cartridge are equipped
- **THEN** `.game-card-static-line` shows arc name (teal) and/or cartridge name + rarity + Lv (teal), separated by `·`

#### Scenario: No equipment shows dash placeholder

- **WHEN** the card is in collapsed state and neither arc nor cartridge is equipped
- **THEN** `.game-card-static-line` shows `—` with the `.no-equip` class

### Requirement: N2E card edit body contains cartridge slot and Target Build

The cartridge slot section (clickable, opens `CartridgeEditorModal`) and the Target Build display SHALL be rendered inside `.game-card-edit-body-inner`, visible only when the card is in editing state.

#### Scenario: Cartridge slot in edit body

- **WHEN** the card is expanded (editing state)
- **THEN** the `.cartridge-slot-section` is visible and clickable, opening `CartridgeEditorModal`

#### Scenario: Target Build in edit body

- **WHEN** the card is expanded and `hasCartridgePrefs` is true
- **THEN** the `.cartridge-target-build` block renders the full preferences (Set, Main, Subs, comments)

### Requirement: N2E summary height budget

The N2E card's inline `--game-card-summary-max-height` SHALL be approximately 100px (matching other games' compact summaries), reduced from the prior 400px.

#### Scenario: Collapsed height is uniform

- **WHEN** N2E cards are rendered in the roster grid
- **THEN** all collapsed cards have the same height regardless of whether cartridge preferences exist (the variable-height Target Build is no longer in the summary)
