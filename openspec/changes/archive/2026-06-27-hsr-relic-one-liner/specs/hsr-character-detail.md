## Delta: Collapsed summary gear one-liner

### Requirement: HSR card collapsed summary shows relic set digest

The HSR character card's collapsed summary SHALL include a `.game-card-static-line` displaying equipped relic set names with piece counts, providing a gear-at-a-glance digest consistent with R1999 and N2E cards.

#### Scenario: Relic sets displayed with counts

- **WHEN** the card is in collapsed state and one or more relic slots have a `setId`
- **THEN** `.game-card-static-line` renders each distinct set name followed by its piece count, sorted by count descending, separated by `·`, colored teal

#### Scenario: Multiple sets displayed

- **WHEN** a character has relics from 2+ different sets
- **THEN** all sets are shown in descending count order (e.g. "Firesmith 4 · Champion 2")

#### Scenario: No relics equipped shows dash

- **WHEN** the card is in collapsed state and no relic slots have a `setId`
- **THEN** `.game-card-static-line` shows `—` with the `.no-equip` class, colored rust

#### Scenario: Long set names handled by CSS overflow

- **WHEN** the combined set text exceeds the card width
- **THEN** the text truncates with ellipsis via the existing `.game-card-static-line` CSS (`text-overflow: ellipsis`)
