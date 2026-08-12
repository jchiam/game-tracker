# hsr-character-detail — Delta

## MODIFIED Requirements

### Requirement: Collapsed summary gear one-liner

The HSR character card's collapsed summary SHALL include a dedicated relic `.game-card-static-line` — the second of the card's two summary lines, after the Light Cone line — displaying equipped relic set names with piece counts, providing a gear-at-a-glance digest consistent with R1999 and N2E cards. Set names SHALL use abbreviated short names from `RELIC_SHORT_NAMES`, falling back to full names for unmapped sets. The relic line SHALL always render, so every HSR card shows exactly two summary lines and collapsed card heights stay uniform across the roster grid.

#### Scenario: Relic sets displayed with abbreviated names

- **WHEN** the card is in collapsed state and one or more relic slots have a `setId`
- **THEN** the relic static line renders each set using its short display name (from `RELIC_SHORT_NAMES` mapping) followed by piece count, falling back to the full name if no short name is mapped

#### Scenario: Multiple sets displayed

- **WHEN** a character has relics from 2+ different sets
- **THEN** all sets are shown in descending count order (e.g. "Firesmith 4 · Streetwise 2"), separated by `·`, colored teal

#### Scenario: No relics equipped shows dash

- **WHEN** the card is in collapsed state and no relic slots have a `setId`
- **THEN** the relic static line still renders, showing `—` with the `.no-equip` class, colored rust — regardless of whether a Light Cone is equipped on the line above

#### Scenario: Relic line truncates independently

- **WHEN** the combined set text exceeds a single line width
- **THEN** the relic line truncates with ellipsis (`text-overflow: ellipsis`, `white-space: nowrap`) without stealing width from or being truncated by the Light Cone line

#### Scenario: Uniform two-line summary height

- **WHEN** any HSR cards render in collapsed state, with any mix of equipped/unequipped cones and relics
- **THEN** every card's collapsed summary contains exactly two `.game-card-static-line` rows (each showing content or its `—` empty state), keeping collapsed card heights uniform

### Requirement: Light Cone card section

The character card SHALL show the Light Cone as an inline section in the psychube style. In the collapsed summary, the Light Cone readout SHALL occupy its own dedicated `.game-card-static-line` — the first of the card's two summary lines, above the relic set line — rendering the equipped cone's catalog icon (resolved through the ImageKit light cone resolver) followed by `{name} · Lv {level} · S{superimposition}` with progress-gradient coloring per segment (level over 1–80, superimposition over 1–5), plus the preference match badge when applicable. When `lightConeId` is null the line SHALL render `—` with the `.no-equip` class, colored rust. If the icon fails to load it SHALL be hidden, leaving the text readout intact. In the edit view, the cone equip controls render as a `ProgressSection` labelled "Equipped" inside the "Light Cone" section group (see Card equipment section clustering), composing the shared primitives: `Select` for the path-filtered picker, `LevelSlider` for level 1–80, and `SegmentedButtons` for S1–S5 — never raw `<select>`/`<input>` elements.

#### Scenario: Summary line with cone equipped

- **WHEN** a character has a Light Cone equipped at level 80 superimposition 5
- **THEN** the first collapsed summary line shows the cone's icon followed by `{cone name} · Lv 80 · S5` with each text segment colored by its progress gradient, and no relic set text shares that line

#### Scenario: Cone line truncates independently

- **WHEN** the cone name plus level/superimposition segments exceed one line width
- **THEN** the Light Cone line truncates with ellipsis on its own line, leaving the relic set line below fully intact

#### Scenario: Summary icon resolves through ImageKit

- **WHEN** the summary icon renders for an equipped cone
- **THEN** its source URL is the catalog `imageUrl` resolved through the ImageKit light cone resolver

#### Scenario: Summary icon load failure

- **WHEN** the summary icon fails to load
- **THEN** the icon is hidden and the text readout renders unchanged

#### Scenario: Summary empty state

- **WHEN** `lightConeId` is null
- **THEN** the first collapsed summary line shows `—` with the `.no-equip` class, colored rust, and the relic set line below renders normally

#### Scenario: Edit section composes shared primitives

- **WHEN** the card is in edit view
- **THEN** the Light Cone group's "Equipped" section renders `Select`, `LevelSlider` (1–80), and `SegmentedButtons` (S1–S5) inside a `ProgressSection`
