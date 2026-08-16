## Purpose

Shared party lineup management used by all game modules via `useParties`. Covers party CRUD, slot constraints per game, reload-after-save, optimistic delete, and game-specific extensions (tier and favorite toggle for all games).

## Requirements

### Requirement: Load parties from DB on session change

The system SHALL load parties from the DB when a user session becomes available, and clear parties when the session is lost.

#### Scenario: Session available

- **WHEN** a valid user session is present
- **THEN** parties are fetched from DB and stored in state, ordered by `created_at` descending

#### Scenario: Session lost

- **WHEN** the user session becomes null
- **THEN** parties state is cleared to an empty array

### Requirement: Save party (create or update)

The system SHALL create a new party or update an existing one by writing to the DB then reloading all parties. The DB is the source of truth for final party state after save.

#### Scenario: Create new party

- **WHEN** user saves a party with no existing `id`
- **THEN** a new party row is inserted and parties are reloaded from DB

#### Scenario: Update existing party

- **WHEN** user saves a party with an existing `id`
- **THEN** party row is updated, existing members are cleared and re-inserted, and parties are reloaded from DB

#### Scenario: Save while unauthenticated

- **WHEN** user attempts to save a party with no active session
- **THEN** save is a no-op and returns null

### Requirement: Delete party

The system SHALL delete a party optimistically from local state and then remove it from the DB.

#### Scenario: Successful delete

- **WHEN** user deletes a party
- **THEN** party is removed from local state immediately and DB delete fires in background

#### Scenario: Delete while unauthenticated

- **WHEN** user attempts to delete a party with no active session
- **THEN** delete is a no-op and returns false

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

#### Scenario: ZZZ party slots

- **WHEN** saving a ZZZ party
- **THEN** member slot indices are in range 0–2 (maximum 3 agents)

#### Scenario: P5X party slots

- **WHEN** saving a P5X party
- **THEN** member slot indices are in range 1–7: slots 1–3 hold up to 3 personas (`member_type = 'persona'`), slots 4–6 hold up to 3 active thieves (`member_type = 'thief'`), and slot 7 holds a single Navigator (`member_type = 'navigator'`). Wonder is implicit (never stored) and occupies no DB slot.

#### Scenario: Navigator slot restricted to Navigator role

- **WHEN** the P5X party editor renders the Navigator slot (index 7)
- **THEN** its member picker lists only thieves with `role === 'Navigator'`

#### Scenario: Active thief slots exclude Navigators

- **WHEN** the P5X party editor renders an active thief slot (index 4–6)
- **THEN** its member picker lists thieves with `role !== 'Navigator'`, so a Navigator can never be picked into an active slot

#### Scenario: Wonder fixed slot rendered

- **WHEN** a P5X party card or editor renders
- **THEN** a fixed, non-editable Wonder slot is shown backed by a committed portrait asset (`/assets/persona-5-phantom-x/wonder.webp`) served as a raw local path, distinct from any roster thief and never persisted to the DB

### Requirement: Party favorite toggle

The system SHALL allow toggling the favorite status of a party optimistically, reverting on failure. This capability is available for all games (HSR, R1999, N2E, AE, P5X, ZZZ).

#### Scenario: Favorite toggled successfully

- **WHEN** user toggles favorite on any game's party
- **THEN** `isFavorited` is updated in local state immediately and persisted to DB

#### Scenario: Favorite toggle fails

- **WHEN** the DB persist call returns false or rejects
- **THEN** party state reverts to the pre-toggle snapshot

### Requirement: Party tier field

The system SHALL support an optional tier field on parties for all games (HSR, R1999, N2E, AE, P5X, ZZZ). Tier is one of S+/S/A/B or null.

#### Scenario: Tier saved with party

- **WHEN** user saves a party with a tier value
- **THEN** tier is persisted and returned with the party on next load

#### Scenario: Tier absent

- **WHEN** no tier is set
- **THEN** tier field is null

### Requirement: Manual party refresh

The system SHALL allow an explicit refresh of parties from the DB without a session change.

#### Scenario: Refresh triggered

- **WHEN** `refreshParties` is called with an active session
- **THEN** parties are reloaded from DB and state is updated

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

### Requirement: Configurable party slots

The shared party editor and card SHALL support an optional per-slot configuration (`PartyViewConfig.slots`) enabling heterogeneous slot types or a non-default slot count. When a game provides no `slots`, the editor and card SHALL fall back to four uniform, unfiltered slots at indices 0–3 — the pre-existing behaviour for HSR, R1999, N2E, and AE.

#### Scenario: Default slots when unconfigured

- **WHEN** a game's `PartyViewConfig` omits `slots`
- **THEN** the editor and card render four uniform slots (indices 0–3) with no entity filtering, identical to prior behaviour

#### Scenario: Uniform reduced slot count

- **WHEN** a game's `PartyViewConfig` declares fewer uniform slots (ZZZ: three unfiltered slots at indices 0–2)
- **THEN** the editor and card render exactly that many slots and no member can be saved at an index outside them

#### Scenario: Fixed display slot

- **WHEN** a slot config declares `fixed: { image, name }`
- **THEN** that slot renders a static image and name in both the editor and the card, is not clickable, has no remove control, and is never written to the DB

#### Scenario: Per-slot entity filter

- **WHEN** a slot config declares an `entityFilter`
- **THEN** the member picker for that slot lists only entities satisfying the filter (e.g. personas for P5X slots 1–3, active thieves for slots 4–6, and Navigator-role thieves for slot 7)

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

### Requirement: Mutually exclusive party members

The party editor SHALL support per-game exclusion groups: entities that share a non-null exclusion group key cannot co-exist in one party. The member picker SHALL hide entities whose exclusion group matches an already-selected member's group. Games that configure no exclusion groups SHALL behave exactly as before.

#### Scenario: Conflicting entity hidden from picker

- **WHEN** a party already contains an entity in exclusion group `trailblazer` and the user opens the member picker for another slot
- **THEN** all other entities in the `trailblazer` group are absent from the picker list

#### Scenario: Conflict cleared on removal

- **WHEN** the last member from an exclusion group is removed from the party
- **THEN** entities of that group reappear in the member picker

#### Scenario: Ungrouped entities unaffected

- **WHEN** a party contains an entity with no exclusion group
- **THEN** the picker excludes only that exact entity, and all other entities remain selectable

#### Scenario: Games without exclusion groups unchanged

- **WHEN** a game's party view config defines no exclusion groups
- **THEN** the member picker filters only exact duplicates, identical to prior behavior
