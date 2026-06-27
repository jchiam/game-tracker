## Delta: Card collapse presentation (slim summary)

### Requirement: N2E card collapsed summary composition

The N2E character card's collapsed summary (`.game-card-static-summary`) SHALL contain exactly two child blocks: a stat chips row and a one-line equipment digest. No editing affordances (buttons, clickable slots) SHALL appear in the collapsed summary.

#### Scenario: Stat chips row displays investment progress

- **WHEN** the card is in collapsed (non-editing) state
- **THEN** `.game-card-static-stats` renders `Lv {level}` and `A {awakeningCount}/6` chips colored by `getProgressStyle`, plus a conditional `Cart {score}%` chip (shown only when cartridge preferences exist and score >= 0, colored by `getProgressStyle(score, 0, 100)`)

#### Scenario: Equipment one-liner shows arc and cartridge digest

- **WHEN** the card is in collapsed state and arc and/or cartridge are equipped
- **THEN** `.game-card-static-line` shows arc name (teal) and/or cartridge name + rarity + Lv (teal), separated by `·`

#### Scenario: No equipment shows dash placeholder

- **WHEN** the card is in collapsed state and neither arc nor cartridge is equipped
- **THEN** `.game-card-static-line` shows `—` with the `.no-equip` class

### Requirement: N2E card edit body contains cartridge slot and Target Build

The cartridge slot section (clickable, opens `CartridgeEditorModal`) and the Target Build display SHALL be rendered inside `.game-card-edit-body-inner`, visible only when the card is in editing state.

#### Scenario: Cartridge slot in edit body

- **WHEN** the card is expanded (editing state)
- **THEN** the `.cartridge-slot-section` is visible and clickable, opening `CartridgeEditorModal`

#### Scenario: Target Build in edit body

- **WHEN** the card is expanded and `hasCartridgePrefs` is true
- **THEN** the `.cartridge-target-build` block renders the full preferences (Set, Main, Subs, comments)

### Requirement: N2E summary height budget

The N2E card's inline `--game-card-summary-max-height` SHALL be approximately 100px (matching other games' compact summaries), reduced from the prior 400px.

#### Scenario: Collapsed height is uniform

- **WHEN** N2E cards are rendered in the roster grid
- **THEN** all collapsed cards have the same height regardless of whether cartridge preferences exist (the variable-height Target Build is no longer in the summary)
