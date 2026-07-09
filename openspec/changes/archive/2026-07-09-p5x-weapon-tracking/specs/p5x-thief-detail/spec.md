## Delta

Adds weapon investment tracking (rarity, level, forge) to the P5X tracked-thief
model, card summary, and card edit body.

## ADDED Requirements

### Requirement: Weapon rarity field

The system SHALL track the rarity of a Thief's equipped weapon as a nullable
integer in the set {2, 3, 4, 5}, defaulting to `null` on add. A `null` value
means the user has not started tracking weapon investment for this Thief.
Setting a rarity activates the weapon section (summary chip + edit controls).

#### Scenario: Default weapon rarity state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponRarity` is `null`

#### Scenario: Weapon rarity set

- **WHEN** user selects a weapon rarity (2, 3, 4, or 5)
- **THEN** `weaponRarity` is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon rarity cleared via allowDeselect

- **WHEN** user deselects the active rarity button
- **THEN** `weaponRarity` is set to `null`, hiding the weapon summary chip

### Requirement: Weapon level field

The system SHALL track the level of a Thief's weapon as an integer in the range
1–80, defaulting to 1 on add. Updates SHALL be clamped to this range before
persisting. Weapon level is shared across all weapons on the same Thief in-game,
so this is effectively a per-Thief stat.

#### Scenario: Weapon level updated within range

- **WHEN** user sets a Thief's weapon level to a value between 1 and 80 inclusive
- **THEN** weapon level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon level clamped below minimum

- **WHEN** user sets a Thief's weapon level below 1
- **THEN** weapon level is clamped to 1 before update

#### Scenario: Weapon level clamped above maximum

- **WHEN** user sets a Thief's weapon level above 80
- **THEN** weapon level is clamped to 80 before update

### Requirement: Weapon forge field

The system SHALL track the forge level (dupe-based upgrade) of a Thief's
equipped weapon as an integer in the range 0–6, defaulting to 0 on add.
Updates SHALL be clamped to this range before persisting.

#### Scenario: Default weapon forge state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponForge` is 0

#### Scenario: Weapon forge updated within range

- **WHEN** user sets a Thief's weapon forge to a value between 0 and 6 inclusive
- **THEN** weapon forge is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon forge clamped to range

- **WHEN** user sets a Thief's weapon forge below 0 or above 6
- **THEN** weapon forge is clamped to 0 or 6 respectively before update

### Requirement: Weapon summary chip

The collapsed (read-only) state of the Thief card SHALL present weapon
investment as a single `StatChip` when `weaponRarity` is not `null`. The chip
SHALL display the equipped rarity and forge level (e.g., `⚔ 5★ F4`). The chip
color SHALL use `getProgressStyle` based on forge (0–6) to match the
investment-gradient language used by other chips. When `weaponRarity` is `null`,
no weapon chip is shown.

#### Scenario: Weapon chip shown when rarity set

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` set (e.g., 5) and `weaponForge` at 4
- **THEN** a `StatChip` with label `⚔ 5★ F4` is shown, colored via `getProgressStyle(weaponForge, 0, 6)`

#### Scenario: No weapon chip when rarity null

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` `null`
- **THEN** no weapon `StatChip` is present

### Requirement: Weapon edit section

The Thief card's edit body SHALL provide a "Weapon" `ProgressSection` after the
Awareness section, containing three controls:

1. **Rarity** — `SegmentedButtons` with options 2★, 3★, 4★, 5★ using
   `coloring="static"` and `allowDeselect` (clearing sets `weaponRarity` to
   `null`). Each option uses a rarity modifier class for per-star color coding.
2. **Level** — `LevelSlider` (1–80) with `getProgressStyle(weaponLevel, 1, 80)`
   gradient fill, matching the thief level slider.
3. **Forge** — `SegmentedButtons` with options F0–F6 using
   `coloring="investment"`, matching the awareness segmented-buttons pattern.

#### Scenario: Weapon section rendered after Awareness

- **WHEN** a Thief card's edit body renders
- **THEN** a "Weapon" `ProgressSection` appears below the Awareness section

#### Scenario: Rarity buttons use static coloring with allowDeselect

- **WHEN** the weapon rarity control renders
- **THEN** it is a `SegmentedButtons` with `coloring="static"`, `allowDeselect`, and four options (2★–5★)

#### Scenario: Level slider shows weapon level

- **WHEN** the weapon level slider renders
- **THEN** it uses `LevelSlider` with min=1, max=80, value=`weaponLevel`

#### Scenario: Forge buttons use investment coloring

- **WHEN** the weapon forge control renders
- **THEN** it is a `SegmentedButtons` with `coloring="investment"` and seven options (F0–F6)

#### Scenario: Weapon section value label reflects state

- **WHEN** `weaponRarity` is set (e.g., 5) with `weaponLevel` 45 and `weaponForge` 4
- **THEN** the `ProgressSection` value displays `5★ · Lv 45 · F4`
- **WHEN** `weaponRarity` is `null`
- **THEN** the `ProgressSection` value displays `—`
