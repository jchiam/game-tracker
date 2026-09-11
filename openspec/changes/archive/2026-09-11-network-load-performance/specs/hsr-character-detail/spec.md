## MODIFIED Requirements

### Requirement: Six relic slots

The system SHALL track one equipped relic per slot across six named slots: head, hands, body, feet, sphere, rope. Each slot defaults to null (empty) on character add. A slot save SHALL persist through the shared `upsertEquipmentSlot` helper — one atomic `upsert_equipment_slot` RPC that upserts the relic row and replaces its substat rows.

#### Scenario: Relic saved to slot

- **WHEN** user saves relic data to a slot
- **THEN** slot is updated optimistically in local state and a debounced single-RPC upsert (relic row + replaced substats) is queued for that slot

#### Scenario: Relic cleared from slot

- **WHEN** user removes the relic from a slot
- **THEN** slot is set to an empty relic (`{ setId: null, mainStat: null, subStats: [] }`) in local state and a debounced delete is queued

#### Scenario: Relic structure

- **WHEN** a relic is equipped in any slot
- **THEN** it contains: `setId` (string or null), `mainStat` (string or null), `subStats` (array of stat-type id strings — no per-substat value)

### Requirement: Build preferences — main stat chains

The system SHALL track ordered stat preference chains for the four variable main-stat slots: body, feet, sphere, rope. Head and hands have fixed main stats and SHALL NOT have preference chains.

#### Scenario: Main stat preference saved

- **WHEN** user saves build preferences with main stat chains for body, feet, sphere, or rope
- **THEN** each chain is an ordered array of `StatPreference` entries persisted atomically through the shared `savePreferenceRows` RPC (see shared-save-behaviour spec)

#### Scenario: Empty main stat chain

- **WHEN** no preferences are set for a variable slot
- **THEN** the chain is an empty array; the slot scores 0 for main stat match in relic scoring
