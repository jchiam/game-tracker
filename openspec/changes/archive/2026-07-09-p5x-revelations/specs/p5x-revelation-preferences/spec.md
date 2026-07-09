## ADDED Requirements

### Requirement: Revelation build-preference state shape

The system SHALL track `revelationPreferences` on each `P5xTrackedThief` containing:

- `heavensSetId: string | null` — preferred Heavens set
- `spaceSetId: string | null` — preferred Space set
- `mainStats`: per-slot preference chains for the variable-stat slots:
  - `moon: StatPreference[]`
  - `star: StatPreference[]`
  - `sky: StatPreference[]`
- `subStats: StatPreference[]` — preferred substats in priority order

This reuses the existing `StatPreference` interface (`{ stat, operator, orderIndex }`).

#### Scenario: Default preferences on add

- **WHEN** a Thief is added to the roster
- **THEN** `revelationPreferences` has null set IDs and empty preference chains

#### Scenario: Preferences independent of equipped cards

- **WHEN** a Thief has revelation preferences set but no cards equipped
- **THEN** preferences are persisted and displayed independently

### Requirement: Preferred set selection

The system SHALL allow selecting a preferred Heavens set and a preferred Space set from the respective catalogs via `Select` dropdowns. Selection SHALL be persisted via debounced save.

#### Scenario: Set preferred Heavens set

- **WHEN** user selects a Heavens set from the dropdown
- **THEN** `revelationPreferences.heavensSetId` updates in local state and is queued for DB write

#### Scenario: Clear preferred set

- **WHEN** user selects the empty/none option
- **THEN** the set preference becomes `null`

### Requirement: Main stat preference chains

The system SHALL allow defining a `PreferenceChain` for each variable-stat slot (Moon, Star, Sky). Sun and Space are excluded (fixed main stats). Chains use the existing `PreferenceChain` component with operators `>`, `>=`, `OR`.

#### Scenario: Set Moon main stat preference

- **WHEN** user adds stats to the Moon preference chain
- **THEN** `revelationPreferences.mainStats.moon` is updated with ordered `StatPreference` entries

#### Scenario: Stat options filtered by slot

- **WHEN** the Moon preference chain picker is shown
- **THEN** only Moon-valid main stats are offered (ATK%, DEF%, HP%, HP Recovery%, DMG Multiplier%)

### Requirement: Substat preference chain

The system SHALL allow defining a substat priority chain from the shared substat pool. Uses `PreferenceChain` component.

#### Scenario: Set substat priorities

- **WHEN** user defines substat preferences
- **THEN** `revelationPreferences.subStats` stores the ordered chain

### Requirement: Preference persistence via savePreferenceRows

The system SHALL persist revelation preferences using the shared `savePreferenceRows` helper pattern. Preference rows SHALL be stored in a `p5x_revelation_preferences` table with columns: `id` (UUID PK), `thief_row_id` (FK ON DELETE CASCADE), `category` (TEXT — 'heavens_set', 'space_set', 'moon_main', 'star_main', 'sky_main', 'sub_stats'), `stat` (TEXT), `operator` (TEXT nullable), `order_index` (INTEGER). Set preferences are stored as single rows with `stat` = the set ID.

#### Scenario: Save main stat chain

- **WHEN** user saves Moon main stat preferences [ATK% > Crit Rate%]
- **THEN** two rows are written: (category='moon_main', stat='ATK%', order_index=0), (category='moon_main', stat='Crit Rate%', operator='>', order_index=1)

#### Scenario: Save set preference

- **WHEN** user selects Heavens set 'strife'
- **THEN** one row is written: (category='heavens_set', stat='strife', order_index=0)

#### Scenario: Non-atomic save caveat

- **WHEN** preference rows are saved
- **THEN** the existing delete-then-insert pattern is used (same known limitation as HSR/N2E preferences)
