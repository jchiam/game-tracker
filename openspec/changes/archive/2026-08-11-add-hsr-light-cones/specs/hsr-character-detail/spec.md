## ADDED Requirements

### Requirement: Equipped Light Cone

The system SHALL track an equipped Light Cone per character with three fields: `lightConeId` (string catalog id or null), `lightConeLevel` (integer 1–80), and `lightConeSuperimposition` (integer 1–5). Defaults on add: id null, level 1, superimposition 1. All three persist as columns on `hsr_tracked_characters` (`light_cone_id`, `light_cone_level`, `light_cone_superimposition`) and update as plain fields through the debounced save queue.

#### Scenario: Light Cone equipped

- **WHEN** user selects a Light Cone from the picker
- **THEN** `lightConeId` is updated in local state immediately and queued for DB write

#### Scenario: Light Cone unequipped

- **WHEN** user clears the Light Cone selection
- **THEN** `lightConeId` is set to null (level and superimposition retain their values but are not displayed)

#### Scenario: Level clamped to range

- **WHEN** user sets the Light Cone level outside 1–80
- **THEN** the value is clamped into 1–80 before update

#### Scenario: Superimposition set

- **WHEN** user selects a superimposition rank S1–S5
- **THEN** `lightConeSuperimposition` is updated in local state and queued for DB write

### Requirement: Path-filtered Light Cone picker

The Light Cone picker SHALL offer only cones whose `path` exactly matches the character's `path` — equipping is path-locked in game, so off-path cones are never listed. Options SHALL follow catalog order (rarity descending, then name). The picker SHALL include an empty option ("No Light Cone") that unequips.

#### Scenario: Only matching-path cones listed

- **WHEN** the picker renders for a character
- **THEN** its options are exactly `ALL_LIGHT_CONES.filter(lc => lc.path === character.path)` plus the empty option

#### Scenario: Off-path stored id still renders

- **WHEN** a tracked character's stored `lightConeId` no longer matches the character's path (e.g. after an upstream path change)
- **THEN** the summary still resolves and displays the cone by id; only the picker excludes off-path options

### Requirement: Light Cone card section

The character card SHALL show the Light Cone as an inline section in the psychube style. In the collapsed summary, a one-line readout renders `{name} · Lv {level} · S{superimposition}` with progress-gradient coloring per segment (level over 1–80, superimposition over 1–5), or a "No Light Cone" empty state when `lightConeId` is null. In the edit view, a `ProgressSection` labelled "Light Cone" composes the shared primitives: `Select` for the path-filtered picker, `LevelSlider` for level 1–80, and `SegmentedButtons` for S1–S5 — never raw `<select>`/`<input>` elements.

#### Scenario: Summary line with cone equipped

- **WHEN** a character has a Light Cone equipped at level 80 superimposition 5
- **THEN** the collapsed card shows `{cone name} · Lv 80 · S5` with each segment colored by its progress gradient

#### Scenario: Summary empty state

- **WHEN** `lightConeId` is null
- **THEN** the collapsed card shows "No Light Cone"

#### Scenario: Edit section composes shared primitives

- **WHEN** the card is in edit view
- **THEN** the Light Cone section renders `Select`, `LevelSlider` (1–80), and `SegmentedButtons` (S1–S5) inside a `ProgressSection`
