## MODIFIED Requirements

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
