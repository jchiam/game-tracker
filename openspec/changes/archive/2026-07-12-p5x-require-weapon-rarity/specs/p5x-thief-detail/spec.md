## MODIFIED Requirements

### Requirement: Weapon rarity field

The system SHALL track the rarity of a Thief's equipped weapon as a **non-null**
integer in the set {2, 3, 4, 5}, defaulting to `2` (the lowest tier) on add.
Every Thief has the lowest-tier weapon equipped for free from day one, so the
rarity is always present and can never be cleared. There is no "untracked"
(`null`) weapon state.

#### Scenario: Default weapon rarity state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponRarity` is `2`

#### Scenario: Weapon rarity set

- **WHEN** user selects a weapon rarity (2, 3, 4, or 5)
- **THEN** `weaponRarity` is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon rarity cannot be cleared

- **WHEN** the weapon rarity control renders
- **THEN** it offers no deselect affordance; `weaponRarity` always holds one of 2, 3, 4, or 5

### Requirement: Weapon summary chip

The collapsed (read-only) state of the Thief card SHALL present weapon
investment as a single `StatChip`, always shown (rarity is never absent). The
chip SHALL display the equipped rarity and forge level (e.g., `⚔ 5★ F4`). The
chip color SHALL use `getProgressStyle` based on forge (0–6) to match the
investment-gradient language used by other chips.

#### Scenario: Weapon chip always shown

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` (e.g., 5) and `weaponForge` at 4
- **THEN** a `StatChip` with label `⚔ 5★ F4` is shown, colored via `getProgressStyle(weaponForge, 0, 6)`

#### Scenario: Weapon chip shown at default rarity

- **WHEN** a freshly added Thief card renders its collapsed summary (`weaponRarity` 2, `weaponForge` 0)
- **THEN** a `StatChip` with label `⚔ 2★ F0` is shown

### Requirement: Weapon edit section

The Thief card's edit body SHALL provide a "Weapon" `ProgressSection` after the
Awareness section, containing three controls:

1. **Rarity** — `SegmentedButtons` with options 2★, 3★, 4★, 5★ using
   `coloring="static"` and **no** `allowDeselect` (rarity is always one of the
   four options and cannot be cleared). Each option uses a rarity modifier class
   for per-star color coding.
2. **Level** — `LevelSlider` (1–80) with `getProgressStyle(weaponLevel, 1, 80)`
   gradient fill, matching the thief level slider.
3. **Forge** — `SegmentedButtons` with options F0–F6 using
   `coloring="investment"`, matching the awareness segmented-buttons pattern.

#### Scenario: Weapon section rendered after Awareness

- **WHEN** a Thief card's edit body renders
- **THEN** a "Weapon" `ProgressSection` appears below the Awareness section

#### Scenario: Rarity buttons use static coloring without deselect

- **WHEN** the weapon rarity control renders
- **THEN** it is a `SegmentedButtons` with `coloring="static"`, no `allowDeselect`, and four options (2★–5★)

#### Scenario: Level slider shows weapon level

- **WHEN** the weapon level slider renders
- **THEN** it uses `LevelSlider` with min=1, max=80, value=`weaponLevel`

#### Scenario: Forge buttons use investment coloring

- **WHEN** the weapon forge control renders
- **THEN** it is a `SegmentedButtons` with `coloring="investment"` and seven options (F0–F6)

#### Scenario: Weapon section value label reflects state

- **WHEN** `weaponRarity` is 5 with `weaponLevel` 45 and `weaponForge` 4
- **THEN** the `ProgressSection` value displays `5★ · Lv 45 · F4`
