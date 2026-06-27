## Delta: Gear one-liner polish (abbreviation + height reservation)

### Requirement: Collapsed summary gear one-liner

_(Modifies existing requirement — updates scenarios)_

#### Scenario: Relic sets displayed with abbreviated names

- **WHEN** the card is in collapsed state and one or more relic slots have a `setId`
- **THEN** `.game-card-static-line` renders each set using its short display name (from `RELIC_SHORT_NAMES` mapping) followed by piece count, falling back to the full name if no short name is mapped

#### Scenario: One-liner truncates with ellipsis

- **WHEN** the combined set text exceeds a single line width
- **THEN** the text is truncated with ellipsis (`text-overflow: ellipsis`, `white-space: nowrap`)

#### Scenario: Fixed 1-line height reservation

- **WHEN** the card is in collapsed state regardless of whether relics are equipped
- **THEN** the `.game-card-static-line` area reserves exactly 1 line of vertical space via `min-height`, ensuring uniform collapsed card height across all HSR cards
