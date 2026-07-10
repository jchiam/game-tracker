## ADDED Requirements

### Requirement: Slot-grid card entry

Every multi-slot equipment-tracking game (HSR relics, P5X revelations) SHALL render a clickable slot grid in the card's edit body using the shared `.equip-slot-grid` / `.equip-slot-cell` classes from `card.css`. Each cell represents one equipment slot, renders a set icon when the game has set art or a per-slot glyph fallback otherwise, carries an active state when the slot holds an item (non-null `setId`), and — when clicked — opens the game's unified equipment editor modal anchored to that slot. Single-slot games (N2E cartridge) MAY render a single slot affordance instead of a grid.

#### Scenario: Clicking a slot cell opens the editor anchored to that slot

- **WHEN** the user clicks a slot cell in the card's equipment grid
- **THEN** the game's unified equipment editor modal opens with that slot scrolled into view on the Equip tab

#### Scenario: Equipped cell shows active state

- **WHEN** a slot holds an item with a non-null `setId`
- **THEN** its grid cell renders in the active state (icon or glyph, active styling); an empty slot renders the inactive glyph

#### Scenario: Grid uses shared classes

- **WHEN** a multi-slot game's card equipment grid is inspected
- **THEN** it uses the shared `.equip-slot-grid` and `.equip-slot-cell` classes from `card.css`, with per-game CSS adding only game-specific overrides

### Requirement: Unified all-slots editor modal

Each game SHALL provide exactly one equipment editor modal per tracked entity, covering all of the game's equipment slots in a single Equip tab (vertical slot cards using the shared `.equip-slot-card` / `.equip-slot-header` classes from `controls.css`). The modal SHALL accept an optional anchor slot; when provided, the corresponding slot card is scrolled into view on mount (via an optional-chained `scrollIntoView` call so non-DOM test environments do not throw). Per-slot editor modals SHALL NOT be used.

#### Scenario: All slots editable in one open

- **WHEN** the user opens the equipment editor modal
- **THEN** every equipment slot of the game is editable on the Equip tab without closing the modal

#### Scenario: Anchor slot scrolled into view

- **WHEN** the modal is opened with an anchor slot
- **THEN** that slot's card is scrolled into view on mount; without an anchor, the tab opens at the top

#### Scenario: Slot cards use shared classes

- **WHEN** the Equip tab's slot sections are inspected
- **THEN** each is a `.equip-slot-card` with a `.equip-slot-header`, styled by `controls.css`

### Requirement: Complete Build Preferences tab

Each game's equipment editor SHALL present its entire build-preference surface in a single Build Preferences tab, composed in this order: preferred set control(s) (`Select`), per-slot main-stat `PreferenceChain`s for every variable-main slot, the substat `PreferenceChain`, and a `BuildComments` field. No preference control SHALL be scoped to (or hidden behind) the currently viewed equip slot.

#### Scenario: All variable-slot main chains visible together

- **WHEN** the user opens the Build Preferences tab in a multi-slot game
- **THEN** the main-stat preference chains for all variable-main slots are visible at once

#### Scenario: Comments field present in every game

- **WHEN** the Build Preferences tab renders in any game
- **THEN** a `BuildComments` field is present and its value persists with the game's build preferences

### Requirement: Per-slot clear semantics

In a multi-slot editor, choosing the set `Select`'s "None" option on a slot card SHALL clear (un-equip) that slot. A footer "Un-equip" action SHALL exist only in single-item editors (N2E cartridge), where it is the per-item clear; multi-slot editors SHALL have only a "Done" footer action.

#### Scenario: Set None clears the slot

- **WHEN** the user selects the "None" option on a slot card's set `Select`
- **THEN** that slot's equipment is cleared while the modal stays open and other slots are unaffected

#### Scenario: Multi-slot footer has no un-equip button

- **WHEN** a multi-slot editor modal's footer renders
- **THEN** it contains only the "Done" action

### Requirement: Target Build card readout

Every equipment-tracking game's card edit body SHALL render a read-only Target Build display of the entity's build preferences (set preference where applicable, main-stat chains, substat chain, comments) inside a `ProgressSection`, shown only when preferences exist.

#### Scenario: Readout rendered when preferences exist

- **WHEN** a tracked entity has any build preference set and its card is in editing state
- **THEN** a "Target Build" `ProgressSection` renders the preference chains read-only (stat badges with operator badges)

#### Scenario: Readout hidden without preferences

- **WHEN** a tracked entity has no build preferences
- **THEN** no Target Build section renders

### Requirement: Single numeric score surface

The header `ScoreBadge` SHALL be the only numeric equipment-match score display on a roster card. Summary chips MAY use the score for coloring (e.g. via `getProgressStyle(score, 0, 100)`) but SHALL NOT display the score value as text.

#### Scenario: No duplicate score chip

- **WHEN** a roster card renders with a computed score
- **THEN** the score value appears only in the header `ScoreBadge`; no summary chip repeats it as text

#### Scenario: Score-colored chip allowed

- **WHEN** a summary chip is colored by the match score
- **THEN** the chip's label carries non-score content (e.g. set names) while only its color derives from the score
