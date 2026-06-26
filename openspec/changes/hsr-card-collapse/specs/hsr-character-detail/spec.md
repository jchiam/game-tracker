## ADDED Requirements

### Requirement: Character card collapse presentation

The HSR character card SHALL use the canonical collapse mechanism (see `shared-card-collapse`): a read-only static summary shown by default and an edit body shown when the card body has `.is-editing`, toggled by an edit button in the card-image overlay. The collapsed summary SHALL present exactly a compact, fixed set of investment chips and SHALL NOT show editing controls (sliders, the relic grid, or the Target Build display); those SHALL live in the edit body.

#### Scenario: Default state shows the read-only summary

- **WHEN** an HSR character card is rendered and not being edited
- **THEN** the collapsed summary is visible with the investment chips, and the level slider, traces checkbox, relic grid, and Target Build display are in the edit body (collapsed, `max-height: 0`)

#### Scenario: Edit toggle reveals the editing controls

- **WHEN** the user activates the card's edit toggle
- **THEN** `.is-editing` is applied to the card body, the summary collapses, and the edit body expands to reveal the level slider, traces checkbox, relic grid, and Target Build display

### Requirement: Collapsed summary composition

The collapsed summary SHALL contain three gradient-colored stat chips, colored via the shared investment gradient (`getProgressStyle`): a level chip `Lv {level}` (gradient over 1–80), a traces indicator chip showing attained/not (gradient: attained = complete/teal, not = uninvested/rust), and a relic slot-fill chip `Relics {n}/6` where `n` is the count of slots holding a relic with a non-null `setId` (gradient over 0–6). The relic-score badge SHALL remain in the card-image overlay with its existing tier logic and SHALL NOT move into the summary.

#### Scenario: Relic slot-fill count reflects equipped slots

- **WHEN** a character has relics with a non-null `setId` in 4 of the 6 slots
- **THEN** the summary shows a `Relics 4/6` chip whose color is the gradient value for 4 out of 6

#### Scenario: Traces indicator reflects attainment

- **WHEN** a character's `tracesAttained` is true
- **THEN** the traces chip renders in the complete (teal) end of the gradient; when false, it renders in the uninvested (rust) end

#### Scenario: Score badge stays in the overlay

- **WHEN** a character has build preferences and a calculated relic score
- **THEN** the score badge renders in the card-image overlay (not in the body summary), unchanged from current behavior
