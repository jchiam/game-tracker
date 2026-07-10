## MODIFIED Requirements

### Requirement: Six relic slots

The system SHALL track one equipped relic per slot across six named slots: head, hands, body, feet, sphere, rope. Each slot defaults to null (empty) on character add.

#### Scenario: Relic saved to slot

- **WHEN** user saves relic data to a slot
- **THEN** slot is updated optimistically in local state and a debounced upsert is queued for that slot

#### Scenario: Relic cleared from slot

- **WHEN** user removes the relic from a slot
- **THEN** slot is set to an empty relic (`{ setId: null, mainStat: null, subStats: [] }`) in local state and a debounced delete is queued

#### Scenario: Relic structure

- **WHEN** a relic is equipped in any slot
- **THEN** it contains: `setId` (string or null), `mainStat` (string or null), `subStats` (array of stat-type id strings — no per-substat value)
