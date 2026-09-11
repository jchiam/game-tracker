## Purpose

Shared party lineup management used by all game modules via `useParties`. Covers party CRUD, slot constraints per game, reload-after-save, optimistic delete, and game-specific extensions (tier and favorite toggle for all games).

## Requirements

### Requirement: Load parties from DB on session change

The system SHALL load parties from the DB when a user session becomes available, and clear parties when the session is lost. The hook SHALL expose `isInitialLoad` (true until the first fetch settles) and `isLoadError` (true when the fetch rejected), mirroring the roster hook.

#### Scenario: Session available

- **WHEN** a valid user session is present
- **THEN** parties are fetched from DB and stored in state, ordered by `created_at` descending, and `isInitialLoad` becomes false

#### Scenario: Session lost

- **WHEN** the user session becomes null
- **THEN** parties state is cleared to an empty array and `isInitialLoad` is false

#### Scenario: DB load fails

- **WHEN** the parties fetch rejects
- **THEN** `isLoadError` is set to true, `isInitialLoad` is set to false, and parties state is left empty

### Requirement: Save party (create or update)

The system SHALL create a new party or update an existing one by writing to the DB then reloading all parties. The DB is the source of truth for final party state after save. The hook's save resolves to a `PartySaveResult` (`{ partyId, membersSaved }`) and SHALL surface every failure to the user.

#### Scenario: Create new party

- **WHEN** user saves a party with no existing `id`
- **THEN** a new party row is inserted and parties are reloaded from DB

#### Scenario: Update existing party

- **WHEN** user saves a party with an existing `id`
- **THEN** party row is updated, existing members are cleared and re-inserted, and parties are reloaded from DB

#### Scenario: Save while unauthenticated

- **WHEN** user attempts to save a party with no active session
- **THEN** save is a no-op and resolves with `partyId: null`

#### Scenario: Party-row save fails

- **WHEN** the save resolves with `partyId: null` for an authenticated user
- **THEN** an error toast ("Couldn't save {party}. Please try again.") is shown and no reload is attempted

#### Scenario: Saved without members

- **WHEN** the save resolves with a party id but `membersSaved: false`
- **THEN** parties are reloaded and a warning toast tells the user the {party} was saved without its members

#### Scenario: Post-save reload fails

- **WHEN** the party row saved but the reload rejects
- **THEN** the save still resolves with the party id, an error toast tells the user the list could not be refreshed, and the hook marks a load error so the tab shows the error surface with Retry

### Requirement: Delete party

The system SHALL delete a party optimistically from local state and then remove it from the DB, surfacing a failure to the user.

#### Scenario: Successful delete

- **WHEN** user deletes a party
- **THEN** party is removed from local state immediately and DB delete fires in background

#### Scenario: Delete fails

- **WHEN** the DB delete reports failure
- **THEN** the party stays in local state and an error toast ("Couldn't delete {party}. Please try again.") is shown

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

The system SHALL allow toggling the favorite status of a party optimistically, reverting and notifying on failure. This capability is available for all games (HSR, R1999, N2E, AE, P5X, ZZZ).

#### Scenario: Favorite toggled successfully

- **WHEN** user toggles favorite on any game's party
- **THEN** `isFavorited` is updated in local state immediately and persisted to DB

#### Scenario: Favorite toggle fails

- **WHEN** the DB persist call returns false or rejects
- **THEN** party state reverts to the pre-toggle snapshot and an error toast is shown

### Requirement: Party tier field

The system SHALL support an optional tier field on parties for all games (HSR, R1999, N2E, AE, P5X, ZZZ). Tier is one of S+/S/A/B or null.

#### Scenario: Tier saved with party

- **WHEN** user saves a party with a tier value
- **THEN** tier is persisted and returned with the party on next load

#### Scenario: Tier absent

- **WHEN** no tier is set
- **THEN** tier field is null

### Requirement: Manual party refresh

The system SHALL allow an explicit refresh of parties from the DB without a session change, surfacing a failure to the user.

#### Scenario: Refresh triggered

- **WHEN** `refreshParties` is called with an active session
- **THEN** parties are reloaded from DB and state is updated

#### Scenario: Refresh fails

- **WHEN** the refresh fetch rejects
- **THEN** existing parties state is kept, an error toast is shown, and the hook marks a load error

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

### Requirement: Companion slot

The shared party editor and card SHALL support an optional party-level companion pick: a single entity chosen from a separate companion catalog (not the game's roster entities), configured per game on `PartyViewConfig`. The companion is persisted as a single nullable party-level field (`Party.companionId`, one DB column on the parties table) — never as a member row, so member slot constraints are untouched. Games whose config omits the companion slot SHALL behave exactly as before.

#### Scenario: Games without companion config unchanged

- **WHEN** a game's `PartyViewConfig` declares no companion slot
- **THEN** the editor, card, and save payload are identical to prior behaviour, and `companionId` is never sent

#### Scenario: Companion picked in editor

- **WHEN** the user activates the companion slot in the party editor and selects an entry from the companion picker
- **THEN** the slot shows the selected companion's image and name, and saving the party persists its id as the party-level companion field

#### Scenario: Companion picker searches the companion catalog

- **WHEN** the companion slot is active and the user types a search term
- **THEN** the picker lists only companion-catalog entries matching the term by name — roster entities never appear in the companion picker, and companions never appear in member slot pickers

#### Scenario: Companion cleared

- **WHEN** the user removes the companion from its slot and saves
- **THEN** the party persists with a null companion field

#### Scenario: Companion round-trips

- **WHEN** a party saved with a companion is reloaded from the DB
- **THEN** `companionId` is populated and the editor and card show that companion

#### Scenario: Companion tile on party card

- **WHEN** a party card renders for a game with a companion slot configured
- **THEN** the card shows a labelled companion tile alongside the member avatars — the companion's avatar and name when set, an empty slot placeholder when unset

#### Scenario: ZZZ Bangboo wiring

- **WHEN** the ZZZ parties tab renders
- **THEN** the companion slot is labelled "Bangboo", its picker lists the Bangboo catalog, and the persisted field maps to the `bangboo_id` column on `zzz_parties`

### Requirement: Retry on parties load failure

The system SHALL allow the user to retry a failed parties load without reloading the page. The parties tab's own Retry SHALL retry only the parties load.

#### Scenario: Parties retry triggered

- **WHEN** user triggers a parties retry after a load error
- **THEN** `isLoadError` resets to false, `isInitialLoad` resets to true, and the parties fetch is attempted again
