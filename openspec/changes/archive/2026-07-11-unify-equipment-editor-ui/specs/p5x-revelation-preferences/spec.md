## MODIFIED Requirements

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

## ADDED Requirements

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
