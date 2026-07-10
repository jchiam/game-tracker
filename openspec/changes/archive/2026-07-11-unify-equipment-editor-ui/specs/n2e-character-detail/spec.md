## MODIFIED Requirements

### Requirement: N2E card collapsed summary composition

The N2E character card's collapsed summary (`.game-card-static-summary`) SHALL contain exactly two child blocks: a stat chips row and a one-line equipment digest. No editing affordances (buttons, clickable slots) SHALL appear in the collapsed summary. The header `ScoreBadge` SHALL be the only numeric score display — the summary SHALL NOT include a cartridge-score chip.

#### Scenario: Stat chips row displays investment progress

- **WHEN** the card is in collapsed (non-editing) state
- **THEN** `.game-card-static-stats` renders `Lv {level}` and `A {awakeningCount}/6` chips colored by `getProgressStyle`, and no `Cart {score}%` chip is present

#### Scenario: Equipment one-liner shows arc and cartridge digest

- **WHEN** the card is in collapsed state and arc and/or cartridge are equipped
- **THEN** `.game-card-static-line` shows arc name (teal) and/or cartridge name + rarity + Lv (teal), separated by `·`

#### Scenario: No equipment shows dash placeholder

- **WHEN** the card is in collapsed state and neither arc nor cartridge is equipped
- **THEN** `.game-card-static-line` shows `—` with the `.no-equip` class

### Requirement: N2E card edit body contains cartridge slot and Target Build

The cartridge slot section (clickable, opens `CartridgeEditorModal`) and the Target Build display SHALL be rendered inside `.game-card-edit-body-inner`, visible only when the card is in editing state. Both SHALL be wrapped in the shared `ProgressSection` ("Cartridge" and "Target Build" respectively), matching the HSR card; the custom `.cartridge-slot-section` and `.cartridge-target-build` section wrappers are replaced.

#### Scenario: Cartridge slot in edit body

- **WHEN** the card is expanded (editing state)
- **THEN** a "Cartridge" `ProgressSection` contains the clickable cartridge slot, which opens `CartridgeEditorModal`

#### Scenario: Target Build in edit body

- **WHEN** the card is expanded and the character has any cartridge preference set
- **THEN** a "Target Build" `ProgressSection` renders the full preferences (Set, Main, Subs, comments) read-only

## ADDED Requirements

### Requirement: N2E card edit controls use shared primitives

The N2E character card's edit body SHALL use the shared input primitives: `LevelSlider` for the character level (1–90) and arc level (1–80) controls, and `Select` for the arc picker — not raw `<input type="range">` or `<select>` elements.

#### Scenario: Level controls are LevelSliders

- **WHEN** the N2E card's edit body renders the character and arc level controls
- **THEN** both are `LevelSlider` components carrying the shared investment gradient fill

#### Scenario: Arc picker is the shared Select

- **WHEN** the N2E card's edit body renders the arc picker
- **THEN** it is the shared `Select` component listing all arcs plus a "No Arc" option
