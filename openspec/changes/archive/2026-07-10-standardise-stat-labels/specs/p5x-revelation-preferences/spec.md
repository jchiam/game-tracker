## MODIFIED Requirements

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

The system SHALL persist revelation preferences using the shared `savePreferenceRows` helper pattern. Preference rows SHALL be stored in a `p5x_revelation_preferences` table with columns: `id` (UUID PK), `thief_row_id` (FK ON DELETE CASCADE), `category` (TEXT — 'heavens_set', 'space_set', 'moon_main', 'star_main', 'sky_main', 'sub_stats'), `stat` (TEXT), `operator` (TEXT nullable), `order_index` (INTEGER). Set preferences are stored as single rows with `stat` = the set ID. Main-stat and substat preference rows store the stat **id** in `stat` (not a display label).

#### Scenario: Save main stat chain

- **WHEN** user saves Moon main stat preferences [Attack% > Crit Rate]
- **THEN** two rows are written: (category='moon_main', stat='attack-pct', order_index=0), (category='moon_main', stat='crit-rate', operator='>', order_index=1)

#### Scenario: Save set preference

- **WHEN** user selects Heavens set 'strife'
- **THEN** one row is written: (category='heavens_set', stat='strife', order_index=0)

#### Scenario: Non-atomic save caveat

- **WHEN** preference rows are saved
- **THEN** the existing delete-then-insert pattern is used (same known limitation as HSR/N2E preferences)
