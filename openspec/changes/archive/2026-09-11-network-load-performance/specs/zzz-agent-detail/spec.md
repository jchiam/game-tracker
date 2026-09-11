## MODIFIED Requirements

### Requirement: Equipped Drive Disc tracking

The system SHALL track up to six equipped Drive Discs per agent, keyed by numeric slot 1–6. Each equipped disc records a suit id, a main stat, and up to four substat types (no numeric values). Slots 1–3 carry fixed main stats (HP, ATK, DEF respectively); slots 4–6 carry a main stat from that slot's pool. Persistence is one atomic `upsert_equipment_slot` RPC per `(agent, slot)` through the shared `upsertEquipmentSlot` helper — disc row upserted, substat rows replaced, in one statement; saves flow through the debounced queue with per-slot keys. Removing a disc deletes the row and sets the local slot to `null` — the model SHALL NOT use an empty-disc sentinel object, so in-session state always matches a reload.

#### Scenario: Disc saved to a slot

- **WHEN** user assigns a suit, main stat, and substats to slot 4 and closes the editor
- **THEN** the slot updates optimistically and a single-RPC upsert (disc + replaced substats) is queued under that agent+slot key

#### Scenario: Disc removed

- **WHEN** user clears slot 4
- **THEN** the local slot becomes `null` immediately and a delete is queued; a subsequent reload shows the same `null` slot

#### Scenario: Fixed-main slot saved

- **WHEN** user saves slot 2 with a suit selected
- **THEN** the persisted main stat is forced to ATK regardless of any transient editor state
