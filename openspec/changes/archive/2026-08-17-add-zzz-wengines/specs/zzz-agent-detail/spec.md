## ADDED Requirements

### Requirement: Equipped W-Engine tracking

The system SHALL track one equipped W-Engine per agent: a catalog id (nullable), a level 0–60 (default 0), and a Phase 1–5 (default 1), stored as parent columns on the tracked-agent row and written through the plain field-update patch path. Existing rows with no engine SHALL load as null id / level 0 / Phase 1.

#### Scenario: Engine equipped

- **WHEN** user picks an engine in the card's W-Engine select
- **THEN** the agent updates optimistically and a debounced patch writes the engine id column

#### Scenario: Engine cleared

- **WHEN** user clears the engine select
- **THEN** the engine id becomes null locally and in the DB; level and Phase values are retained but not displayed

### Requirement: W-Engine preference list

The system SHALL track a ranked W-Engine preference list per agent: an ordered array of catalog ids, highest priority first, no duplicates, persisted as a single array column written atomically through the plain field-update patch path (no preference rows). A dedicated W-Engine modal SHALL edit the list via the shared ranked-list preference chain, offering only engines matching the agent's specialty, labelled with name and rarity letter.

#### Scenario: Preferences reordered

- **WHEN** user reorders the ranked list in the W-Engine modal
- **THEN** the array updates optimistically and one debounced patch writes the whole array column

#### Scenario: Specialty filter strict

- **WHEN** the modal lists engine options for a Stun agent
- **THEN** only Stun-specialty engines appear

### Requirement: W-Engine card section

The agent card SHALL render a W-Engine summary line in the collapsed body — engine name, level, and Phase with progress-gradient colouring, plus a match badge showing the equipped engine's preference rank (`#N`, or `Off-build` when listed preferences exclude it; hidden when no preferences or no engine) — and, in the edit body, a labeled W-Engine group containing the equip select (specialty-filtered), a level slider (0–60), Phase segmented buttons (P1–P5), and a preference strip: one icon tile per ranked engine (rank badge, equipped tile highlighted, `+N` overflow tile past the display cap), where tapping a tile only toggles a caption line naming that engine — tiles SHALL NOT mutate state. An Edit Preferences control under the strip (and the overflow tile) SHALL open the W-Engine modal.

#### Scenario: Summary line renders

- **WHEN** an agent has an equipped engine at level 50 Phase 3
- **THEN** the collapsed card shows the engine name, `Lv 50`, and `P3` with gradient colouring

#### Scenario: Match badge ranks

- **WHEN** the equipped engine is ranked #2 in a non-empty preference list
- **THEN** the summary match badge shows `#2`; an unlisted equipped engine shows `Off-build`

#### Scenario: Strip tiles are display-only

- **WHEN** user taps a preference strip tile
- **THEN** a caption line with the engine's rank and name toggles, and no equip or preference state changes

#### Scenario: Overflow tile

- **WHEN** the preference list exceeds the strip display cap
- **THEN** the strip shows the capped tiles followed by a `+N` overflow tile

## MODIFIED Requirements

### Requirement: Agent card composition

The agent card SHALL be composed from the shared Game Card Shell: header portrait with favorite/remove/edit controls, specialty and element badges, a rarity indicator (S/A), a build score badge in the header extra slot (hidden on the `-1` sentinel), a collapsed summary line (level, Mindscape, Core Skill) plus a suit digest line built from short names and piece counts (em-dash placeholder when no discs) and the W-Engine summary line, and edit sections for Level (slider 1–60), Mindscape, and Core Skill followed by a labeled W-Engine group (equip controls + preference strip) and a labeled Drive Discs group containing the six-cell disc slot grid (suit icon or fallback glyph per cell; clicking a cell opens the disc editor anchored to that slot) and, when any preference is set, a Target Build readout (suit badges, per-slot and substat chain readouts, comments). The card SHALL NOT re-implement shell mechanics (header, controls, collapse).

#### Scenario: Card renders shell slots

- **WHEN** a tracked agent renders in the roster grid
- **THEN** the card shows portrait, S/A rarity indicator, specialty + element badges, score badge when scored, the collapsed summary of level, Mindscape (M-prefix), Core Skill letter, the suit digest line, and the W-Engine summary line

#### Scenario: Edit mode sections

- **WHEN** user toggles the card into edit mode
- **THEN** Level, Mindscape, and Core Skill controls are shown in that order, followed by the W-Engine group and then the Drive Discs group with the slot grid

#### Scenario: Target Build readout gated

- **WHEN** an agent has no suit picks, no chains, and no comments
- **THEN** the Target Build readout does not render

#### Scenario: Slot cell opens editor

- **WHEN** user clicks a disc slot cell in the edit body
- **THEN** the disc editor modal opens anchored to that slot

### Requirement: ZZZ roster sort by score

The roster view SHALL offer a score sort mode ordering agents by the blended build score descending (favorites first), alongside the alphabetical and level modes. Agents with the `-1` sentinel sort after scored agents.

#### Scenario: Score sort selected

- **WHEN** user switches the roster sort to score
- **THEN** agents order by build score descending within favorite/non-favorite groups, unscored agents last
