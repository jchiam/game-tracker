## MODIFIED Requirements

### Requirement: Party slot constraints

The system SHALL enforce slot index constraints per game when saving party members.

#### Scenario: HSR party slots

- **WHEN** saving an HSR party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

#### Scenario: R1999 party slots

- **WHEN** saving an R1999 party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

#### Scenario: N2E party slots

- **WHEN** saving an N2E party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

#### Scenario: P5X party slots

- **WHEN** saving a P5X party
- **THEN** member slot indices are in range 0–3 (maximum 4 members)

### Requirement: Party favorite toggle

The system SHALL allow toggling the favorite status of a party optimistically, reverting on failure. This capability is available for all games (HSR, R1999, N2E, AE, P5X).

#### Scenario: Favorite toggled successfully

- **WHEN** user toggles favorite on any game's party
- **THEN** `isFavorited` is updated in local state immediately and persisted to DB

#### Scenario: Favorite toggle fails

- **WHEN** the DB persist call returns false or rejects
- **THEN** party state reverts to the pre-toggle snapshot

### Requirement: Party tier field

The system SHALL support an optional tier field on parties for all games (HSR, R1999, N2E, AE, P5X). Tier is one of S+/S/A/B or null.

#### Scenario: Tier saved with party

- **WHEN** user saves a party with a tier value
- **THEN** tier is persisted and returned with the party on next load

#### Scenario: Tier absent

- **WHEN** no tier is set
- **THEN** tier field is null
