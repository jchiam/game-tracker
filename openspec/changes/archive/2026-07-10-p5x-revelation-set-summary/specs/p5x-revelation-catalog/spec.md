## MODIFIED Requirements

### Requirement: Revelation slot identifiers

The system SHALL export a `REVELATION_SLOTS` array ordered **Space-first**:
`['space', 'sun', 'moon', 'star', 'sky']`, and a type union `RevelationSlot` for type safety. The
Space slot SHALL be identified as the first; the four Heavens slots (`sun`, `moon`, `star`, `sky`)
follow. `HEAVENS_SLOTS` SHALL remain `['sun', 'moon', 'star', 'sky']` (the Heavens grouping is
independent of the display order). Consumers that render slots in array order — e.g. the equip
editor — therefore present the Space card first.

#### Scenario: Slot ordering is space-first

- **WHEN** the slots array is iterated
- **THEN** order is space, sun, moon, star, sky

#### Scenario: Heavens slots unchanged

- **WHEN** `HEAVENS_SLOTS` is read
- **THEN** it is `['sun', 'moon', 'star', 'sky']`
