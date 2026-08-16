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
