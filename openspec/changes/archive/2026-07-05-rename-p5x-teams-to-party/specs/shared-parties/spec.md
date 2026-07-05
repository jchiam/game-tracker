## ADDED Requirements

### Requirement: P5X party view display noun

The P5X module SHALL present its lineup feature using the party flavor noun. The roster page's second view SHALL be labelled "Parties", and the P5X `PartyViewConfig` SHALL use `party: 'Party'`, `partiesLower: 'parties'`, and `header: 'Your Parties'`. The P5X `partyService` default party name SHALL be "New Party".

#### Scenario: Second view labelled Parties

- **WHEN** the P5X page renders its view toggle
- **THEN** the second view button reads "Parties" (not "Teams")

#### Scenario: Party view uses party nouns

- **WHEN** the P5X parties tab renders
- **THEN** its header reads "Your Parties" and party/partiesLower nouns are "Party"/"parties"

#### Scenario: New party default name

- **WHEN** a P5X party is created without an explicit name
- **THEN** its default name is "New Party"
