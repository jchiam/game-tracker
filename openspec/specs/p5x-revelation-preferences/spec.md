## Purpose

Build-preference tracking for P5X Revelation Cards: preferred Heavens/Space sets,
main stat priority chains per variable-stat slot, substat priority chain, and
free-text build comments. Persisted via the shared `savePreferenceRows` pattern,
with comments stored on the parent tracked-thief row.

## Requirements

### Requirement: Revelation build-preference state shape

The system SHALL track `revelationPreferences` on each `P5xTrackedThief` containing:

- `heavensSetId: string | null` — preferred Heavens set
- `spaceSetId: string | null` — preferred Space set
- `mainStats`: per-slot preference chains for the variable-stat slots:
  - `moon: StatPreference[]`
  - `star: StatPreference[]`
  - `sky: StatPreference[]`
- `subStats: StatPreference[]` — preferred substats in priority order
- `comments: string` — free-text build notes, defaulting to `''`

This reuses the existing `StatPreference` interface (`{ stat, operator, orderIndex }`).

#### Scenario: Default preferences on add

- **WHEN** a Thief is added to the roster
- **THEN** `revelationPreferences` has null set IDs, empty preference chains, and empty comments

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

The system SHALL allow defining a `PreferenceChain` for each variable-stat slot (Moon, Star, Sky). Sun and Space are excluded (fixed main stats). Chains use the existing `PreferenceChain` component with operators `>`, `>=`, `OR`. Stat options SHALL be supplied as `{ value, label }` pairs via `toStatOptions(MAIN_STATS[slot])`, so each chain entry's persisted `stat` is a stat **id** while the control displays the in-game label.

#### Scenario: Set Moon main stat preference

- **WHEN** user adds stats to the Moon preference chain
- **THEN** `revelationPreferences.mainStats.moon` is updated with ordered `StatPreference` entries whose `stat` values are ids

#### Scenario: Stat options filtered by slot

- **WHEN** the Moon preference chain picker is shown
- **THEN** only Moon-valid main stats are offered, displayed as `Attack%`, `Defense%`, `HP%`,
  `HP Recovery`, `Damage Mult. +` (ids `attack-pct`, `defense-pct`, `hp-pct`, `hp-recovery`,
  `damage-mult`)

### Requirement: Substat preference chain

The system SHALL allow defining a substat priority chain from the shared substat pool. Uses `PreferenceChain` component with options supplied as `{ value, label }` pairs via `toStatOptions(SUB_STATS)`; persisted `stat` values are stat ids shown by their in-game labels.

#### Scenario: Set substat priorities

- **WHEN** user defines substat preferences
- **THEN** `revelationPreferences.subStats` stores the ordered chain with `stat` values as ids

### Requirement: Preference persistence via savePreferenceRows

The system SHALL persist revelation preferences using the shared `savePreferenceRows` helper pattern, with chain rows built and reconstructed exclusively through the shared preference-chain codec (`chainToRows` / `rowsToChain` in `shared-roster-persistence`). Preference rows SHALL be stored in a `p5x_revelation_preferences` table with columns: `id` (UUID PK), `thief_row_id` (FK ON DELETE CASCADE), `category` (TEXT — 'heavens_set', 'space_set', 'moon_main', 'star_main', 'sky_main', 'sub_stats'), `stat` (TEXT), `operator_to_next` (TEXT nullable — renamed from `operator` to match the HSR/N2E preference tables), `order_index` (INTEGER). Set preferences are stored as single rows with `stat` = the set ID. Main-stat and substat preference rows store the stat **id** in `stat` (not a display label). On save, each chain's `order_index` SHALL be re-derived from array position (`0..n-1`), never taken from the entries' stored `orderIndex` values.

#### Scenario: Save main stat chain

- **WHEN** user saves Moon main stat preferences [Attack% > Crit Rate]
- **THEN** two rows are written: (category='moon_main', stat='attack-pct', order_index=0), (category='moon_main', stat='crit-rate', operator_to_next='>', order_index=1)

#### Scenario: Save set preference

- **WHEN** user selects Heavens set 'strife'
- **THEN** one row is written: (category='heavens_set', stat='strife', order_index=0)

#### Scenario: Degenerate chain normalized on save

- **WHEN** a chain whose in-memory entries carry duplicate `orderIndex` values (mid-chain delete then add — the shared chain editor never renumbers) is saved
- **THEN** the written rows carry `order_index` `0..n-1` in the array order the user saw, so reload order is deterministic and each `operator_to_next` keeps binding the same pair of stats

#### Scenario: Non-atomic save caveat

- **WHEN** preference rows are saved
- **THEN** the existing delete-then-insert pattern is used (same known limitation as HSR/N2E preferences)

### Requirement: Per-Thief preference-state isolation on load

The system SHALL, when loading the roster from the DB, give each Thief's
`revelationPreferences` a freshly-allocated structure, including every array it contains
(`subStats`, `mainStats.moon`, `mainStats.star`, `mainStats.sky`). These arrays SHALL NOT
alias any module-level default object, nor any other Thief's preference state. Mutating one
Thief's loaded preference arrays SHALL NOT affect any other Thief or any subsequent load.

#### Scenario: Two thieves have independent substat arrays

- **WHEN** the roster loads two Thieves that both carry `sub_stats` preference rows
- **THEN** their loaded `revelationPreferences.subStats` are distinct array references
- **AND** neither array is the same reference as any module-level default

#### Scenario: Reload does not accumulate

- **WHEN** the roster is loaded, then loaded again (e.g. session refresh, retry, or React
  StrictMode remount)
- **THEN** a Thief whose stored substat chain has N rows reports exactly N substat
  preferences after each load — never 2N or more

#### Scenario: One thief's edit does not bleed into another

- **WHEN** two Thieves are loaded and one Thief's `revelationPreferences.subStats` is mutated
- **THEN** the other Thief's `revelationPreferences.subStats` is unchanged

### Requirement: Comments persistence via parent column

The system SHALL persist `revelationPreferences.comments` as a `build_comments TEXT` column on `p5x_tracked_thieves`, written through `savePreferenceRows`' `parentUpdate` seam by the thief service's preference-save function — the same parent-column pattern HSR and N2E use. Comments SHALL NOT be stored as a preference row. Loading maps `build_comments` to `comments`, defaulting `''` when null.

#### Scenario: Comments saved with preferences

- **WHEN** revelation preferences are saved with comments text
- **THEN** the preference rows are replaced and `build_comments` is updated on the thief's tracked row in the same save

#### Scenario: Comments loaded

- **WHEN** the roster loads a thief whose row has `build_comments` set
- **THEN** `revelationPreferences.comments` contains that text; a null column loads as `''`

#### Scenario: No comments row in preference table

- **WHEN** preference rows are inspected after a save with comments
- **THEN** no `p5x_revelation_preferences` row carries the comments text
