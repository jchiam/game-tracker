# zzz-agent-detail Specification

## Purpose

Zenless Zone Zero per-Agent tracked fields: level (1–60), Mindscape (M0–M6), Core Skill rung (F→A), favorite toggle, equipped Drive Disc tracking, disc build preferences, the disc editor modal, disc score, level- and score-based sort, roster search keys, and the agent card's composition over the shared Game Card Shell.

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

The agent card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, specialty and element badges, a rarity indicator (S/A), a disc score badge in the header extra slot (hidden on the `-1` sentinel), a collapsed summary line (level, Mindscape, Core Skill) plus a suit digest line built from short names and piece counts (em-dash placeholder when no discs), and edit sections for Level (slider 1–60), Mindscape, and Core Skill followed by a labeled Drive Discs group containing the six-cell disc slot grid (suit icon or fallback glyph per cell; clicking a cell opens the disc editor anchored to that slot) and, when any preference is set, a Target Build readout (suit badges, per-slot and substat chain readouts, comments). The card SHALL NOT re-implement shell mechanics (header, controls, collapse).

#### Scenario: Card renders shell slots

- **WHEN** a tracked agent renders in the roster grid
- **THEN** the card shows portrait, S/A rarity indicator, specialty + element badges, score badge when scored, the collapsed summary of level, Mindscape (M-prefix), Core Skill letter, and the suit digest line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Mindscape, and Core Skill controls are shown in that order, followed by the Drive Discs group with the slot grid

#### Scenario: Target Build readout gated

- **WHEN** an agent has no suit picks, no chains, and no comments
- **THEN** the Target Build readout does not render

#### Scenario: Slot cell opens editor

- **WHEN** user clicks a disc slot cell in the edit body
- **THEN** the disc editor modal opens anchored to that slot

### Requirement: Equipped Drive Disc tracking

The system SHALL track up to six equipped Drive Discs per agent, keyed by numeric slot 1–6. Each equipped disc records a suit id, a main stat, and up to four substat types (no numeric values). Slots 1–3 carry fixed main stats (HP, ATK, DEF respectively); slots 4–6 carry a main stat from that slot's pool. Persistence is an upsert per `(agent, slot)` with substat rows replaced on save; saves flow through the debounced queue with per-slot keys. Removing a disc deletes the row and sets the local slot to `null` — the model SHALL NOT use an empty-disc sentinel object, so in-session state always matches a reload.

#### Scenario: Disc saved to a slot

- **WHEN** user assigns a suit, main stat, and substats to slot 4 and closes the editor
- **THEN** the slot updates optimistically and an upsert (disc + replaced substats) is queued under that agent+slot key

#### Scenario: Disc removed

- **WHEN** user clears slot 4
- **THEN** the local slot becomes `null` immediately and a delete is queued; a subsequent reload shows the same `null` slot

#### Scenario: Fixed-main slot saved

- **WHEN** user saves slot 2 with a suit selected
- **THEN** the persisted main stat is forced to ATK regardless of any transient editor state

### Requirement: Disc build preferences

The system SHALL track per-agent disc build preferences: a 4pc suit pick, a 2pc suit pick, ordered main-stat preference chains for slots 4–6 (with `>` / `>=` / `OR` operators), one global substat chain, and free-text comments. Saving SHALL replace all preference rows in one call through the shared preference-row helper, updating the suit picks and comments as parent columns, and SHALL be queued whole-object (latest-wins) under a per-agent key.

#### Scenario: Preferences saved

- **WHEN** user edits any preference field in the Build Preferences tab
- **THEN** the whole preferences object updates optimistically and one queued save replaces the preference rows and parent columns

#### Scenario: Preferences survive reload

- **WHEN** the roster reloads from DB
- **THEN** chains reconstruct in `order_index` order with operators intact, and suit picks and comments come from the parent row

### Requirement: Disc editor modal

The system SHALL provide a disc editor composed over the shared Equipment Editor Shell with an Equip tab and a Build Preferences tab. The Equip tab renders six slot cards: suit select over the single suit pool, main-stat select for slots 4–6 (read-only fixed stat for slots 1–3), and a substat list; stat controls are gated until a suit is chosen, and on save the main stat is pruned from the substat list. Opening the editor from a card slot SHALL scroll to that slot. The Build Preferences tab renders 4pc and 2pc suit selects, one preference chain per variable slot, the global substat chain, and build comments, all via the shared build-preference primitives.

#### Scenario: Editor opens anchored

- **WHEN** user clicks slot 5 on the agent card
- **THEN** the editor opens on the Equip tab scrolled to slot 5

#### Scenario: Gating before suit chosen

- **WHEN** a slot has no suit selected
- **THEN** its main-stat and substat controls are gated

#### Scenario: Main pruned from substats

- **WHEN** user saves slot 6 with Impact as main and Impact present in its substat list
- **THEN** the persisted substats exclude Impact

### Requirement: ZZZ roster sort by score

The roster view SHALL offer a score sort mode ordering agents by disc score descending (favorites first), alongside the alphabetical and level modes. Agents with the `-1` sentinel sort after scored agents.

#### Scenario: Score sort selected

- **WHEN** user switches the roster sort to score
- **THEN** agents order by score descending within favorite/non-favorite groups, unscored agents last
