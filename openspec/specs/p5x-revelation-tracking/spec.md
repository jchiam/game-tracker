## Purpose

Per-thief Revelation Card equipped state: the 5-slot gear model (Sun, Moon, Star,
Sky, Space), slot updates, DB schema, load/save lifecycle. Covers the "what is
equipped" axis; build preferences live in `p5x-revelation-preferences`.

## Requirements

### Requirement: Per-thief revelation state shape

The system SHALL track a `revelations` object on each `P5xTrackedThief` with five nullable slots: `sun`, `moon`, `star`, `sky`, `space`. Each slot holds an `EquippedRevelation | null`. An `EquippedRevelation` SHALL contain: `setId: string | null`, `mainStat: string | null`, `subStats: RevelationStat[]` (max 4 entries). A `RevelationStat` is `{ type: string, value: number }`.

#### Scenario: Default state on add

- **WHEN** a Thief is added to the roster
- **THEN** all five revelation slots are `null`

#### Scenario: Partial equip

- **WHEN** a Thief has only Sun and Moon slots filled
- **THEN** `revelations.sun` and `revelations.moon` are non-null; `star`, `sky`, `space` remain `null`

### Requirement: Revelation slot update

The system SHALL allow updating a single revelation slot independently. Updates SHALL be optimistic (local state first) and queued for DB write via `usePendingSaves`. The update payload specifies the slot key and the new `EquippedRevelation` value (or `null` to clear).

#### Scenario: Equip a card in a slot

- **WHEN** user sets a revelation slot (e.g. `sun`) to a new `EquippedRevelation`
- **THEN** local state updates immediately and a DB write is queued

#### Scenario: Clear a slot

- **WHEN** user clears a revelation slot
- **THEN** slot becomes `null` in local state and DB write is queued

### Requirement: DB schema for revelation cards

The system SHALL store revelation cards in a `p5x_revelation_cards` table with columns: `id` (UUID PK), `thief_row_id` (FK to `p5x_tracked_thieves.id` ON DELETE CASCADE), `slot` (TEXT, CHECK in sun/moon/star/sky/space), `set_id` (TEXT), `main_stat` (TEXT), `sub_stats` (JSONB — array of `{type, value}`). Unique constraint on `(thief_row_id, slot)`. RLS enabled with user-scoped policy via joined profile_id.

#### Scenario: One card per slot per thief

- **WHEN** a card is upserted for slot `moon` on a thief that already has a moon card
- **THEN** the existing row is replaced (upsert on unique constraint)

#### Scenario: Thief deletion cascades

- **WHEN** a tracked thief is deleted
- **THEN** all associated revelation card rows are deleted

#### Scenario: RLS enforcement

- **WHEN** a user queries revelation cards
- **THEN** only rows belonging to their profile are returned

### Requirement: Load revelations with thief

The system SHALL load all revelation card rows for a thief when loading the roster and merge them into the `revelations` object by slot key. Missing slots default to `null`.

#### Scenario: Full load merge

- **WHEN** a thief has 3 revelation rows in DB (sun, moon, star)
- **THEN** after load, `revelations.sun`, `.moon`, `.star` are populated; `.sky`, `.space` are `null`

#### Scenario: DB disabled

- **WHEN** DB is disabled (no session)
- **THEN** all revelation slots remain at their default `null` values

### Requirement: Save revelation card

The system SHALL persist a revelation card via upsert (INSERT ON CONFLICT UPDATE) on `(thief_row_id, slot)`. If the slot value is `null`, the row SHALL be deleted instead.

#### Scenario: Upsert new card

- **WHEN** user equips a card in a slot with no existing row
- **THEN** a new row is inserted

#### Scenario: Upsert updated card

- **WHEN** user changes a card in a slot that already has a row
- **THEN** the existing row is updated

#### Scenario: Delete on null

- **WHEN** user clears a slot (sets to null)
- **THEN** the row for that slot is deleted from DB
