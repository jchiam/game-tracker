# zzz-agent-detail Specification

## Purpose
Zenless Zone Zero per-Agent tracked fields: level (1–60), Mindscape (M0–M6), Core Skill rung (F→A), favorite toggle, level-based sort, roster search keys, and the agent card's composition over the shared Game Card Shell.
## Requirements
### Requirement: Agent level field

The system SHALL track an Agent's level as an integer in the range 1–60, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting. 60 is the current live-game cap; a future cap raise is a paired slider-max + DB CHECK change.

#### Scenario: Level updated within range

- **WHEN** user sets an Agent's level to a value between 1 and 60 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped

- **WHEN** an update would set level outside 1–60
- **THEN** the persisted value is clamped into range

### Requirement: Agent Mindscape field

The system SHALL track an Agent's Mindscape Cinema rank as an integer 0–6, defaulting to 0 on add, displayed as M0–M6. The edit control SHALL be a single-select rung control (0–6).

#### Scenario: Mindscape updated

- **WHEN** user selects a Mindscape rank 0–6
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Mindscape displayed with M prefix

- **WHEN** an agent card renders a Mindscape value `n`
- **THEN** it is shown as `M{n}` (e.g. `M6`)

### Requirement: Agent Core Skill field

The system SHALL track an Agent's Core Skill unlock rung as an integer 0–6, defaulting to 0 on add, where 0 = locked and 1–6 display as the in-game letter rungs F, E, D, C, B, A in that order. The edit control SHALL be a single-select rung control ordered F→A.

#### Scenario: Core Skill updated

- **WHEN** user selects a Core Skill rung
- **THEN** the value is updated optimistically and queued for DB write

#### Scenario: Letter display

- **WHEN** an agent card renders Core Skill value 6
- **THEN** it is shown as `A`; value 1 shows as `F`; value 0 shows as locked/none

### Requirement: Favorite toggle

The system SHALL allow toggling an Agent's favorite status optimistically, reverting on failure. Favorited agents sort ahead of non-favorited agents in the roster.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an agent card
- **THEN** `isFavorited` updates in local state immediately and persists via debounced save

### Requirement: ZZZ roster sort by level

The roster view SHALL offer a level sort mode ordering agents by level descending (favorites first), alongside the default alphabetical mode.

#### Scenario: Level sort selected

- **WHEN** user switches the roster sort to level
- **THEN** agents are ordered by level descending within favorite/non-favorite groups

### Requirement: ZZZ roster search keys

The roster search SHALL match agents against `name`, `specialty`, and `element` using the shared fuzzy search.

#### Scenario: Search by specialty

- **WHEN** user types `Rupture` in the roster search
- **THEN** agents whose specialty is Rupture are listed

### Requirement: Agent card composition

The agent card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, specialty and element badges, a rarity indicator (S/A), a collapsed summary line (level, Mindscape, Core Skill), and edit sections for Level (slider 1–60), Mindscape, and Core Skill. The card SHALL NOT re-implement shell mechanics (header, controls, collapse).

#### Scenario: Card renders shell slots

- **WHEN** a tracked agent renders in the roster grid
- **THEN** the card shows portrait, S/A rarity indicator, specialty + element badges, and the collapsed summary of level, Mindscape (M-prefix), and Core Skill letter

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Mindscape, and Core Skill controls are shown in that order

