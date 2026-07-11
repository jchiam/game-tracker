## ADDED Requirements

### Requirement: Configurable party member picker search

The shared party editor member picker SHALL match entities using a fuzzy search over a configurable set of entity fields, so that the picker's search behaviour matches the game's roster search for the same catalog.

`PartyViewConfig` SHALL accept an optional `searchKeys: string[]` naming the entity fields the picker searches. When present, the picker SHALL match the search term against those fields using Fuse.js with threshold `0.3` (the same engine and threshold used by the roster search). When `searchKeys` is omitted, the picker SHALL default to `['name']`.

The search SHALL compose with the existing picker filters: results MUST still exclude entities already added to the party and MUST still satisfy the active slot's `entityFilter`.

#### Scenario: Search by a configured non-name field

- **GIVEN** a game whose `PartyViewConfig.searchKeys` includes `codename`
- **WHEN** the user types a term matching an entity's `codename` but not its `name` (e.g. "Joker" for the thief "Ren Amamiya")
- **THEN** the member picker lists that entity

#### Scenario: Default search field when searchKeys omitted

- **GIVEN** a game whose `PartyViewConfig` declares no `searchKeys`
- **WHEN** the user types a term in the member picker
- **THEN** the picker matches the term against the entity `name` field only

#### Scenario: Search composes with slot filter and exclusion

- **GIVEN** a slot with an `entityFilter` and a party that already contains one matching entity
- **WHEN** the user's search term matches both the added entity and an unadded entity that satisfies the filter
- **THEN** the picker lists only the unadded entity that satisfies the slot filter
