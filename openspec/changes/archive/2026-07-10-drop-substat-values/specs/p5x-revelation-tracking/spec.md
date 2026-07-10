## MODIFIED Requirements

### Requirement: Per-thief revelation state shape

The system SHALL track a `revelations` object on each `P5xTrackedThief` with five nullable slots: `sun`, `moon`, `star`, `sky`, `space`. Each slot holds an `EquippedRevelation | null`. An `EquippedRevelation` SHALL contain: `setId: string | null`, `mainStat: string | null`, `subStats: string[]` (max 4 entries — stat-type ids, no per-substat value).

`mainStat` and each `subStats` entry SHALL store a **stat id** (from `MAIN_STATS` / `SUB_STATS`),
not a display label. Display surfaces resolve the id to its in-game label via `STAT_LABELS`,
falling back to the raw id when no label exists.

The Space slot's main stats are **fixed and dual** (Attack + Defense) and are **not stored** on the
card: `mainStat` SHALL be `null` for a Space card, and the Space slot's two fixed mains are derived
for display from the `SPACE` entry of `MAIN_STATS` (`attack`, `defense`). Space cards still store
`setId` and `subStats` normally.

#### Scenario: Default state on add

- **WHEN** a Thief is added to the roster
- **THEN** all five revelation slots are `null`

#### Scenario: Partial equip

- **WHEN** a Thief has only Sun and Moon slots filled
- **THEN** `revelations.sun` and `revelations.moon` are non-null; `star`, `sky`, `space` remain `null`

#### Scenario: Stat values are ids

- **WHEN** a card is equipped with main stat `Damage Mult. +` and a `Crit Mult.` substat
- **THEN** `mainStat` stores `damage-mult` and the substat entry stores `crit-mult`, and both
  render through `STAT_LABELS` as `Damage Mult. +` / `Crit Mult.`

#### Scenario: Space card mains are fixed and derived

- **WHEN** a Space card is equipped
- **THEN** its `mainStat` is `null`, and the editor/summary display its two fixed mains as `Attack`
  and `Defense` derived from `MAIN_STATS.SPACE`, not from stored values

### Requirement: DB schema for revelation cards

The system SHALL store revelation cards in a `p5x_revelation_cards` table with columns: `id` (UUID PK), `thief_row_id` (FK to `p5x_tracked_thieves.id` ON DELETE CASCADE), `slot` (TEXT, CHECK in sun/moon/star/sky/space), `set_id` (TEXT), `main_stat` (TEXT), `sub_stats` (JSONB — array of stat-type id strings). Unique constraint on `(thief_row_id, slot)`. RLS enabled with user-scoped policy via joined profile_id.

#### Scenario: One card per slot per thief

- **WHEN** a card is upserted for slot `moon` on a thief that already has a moon card
- **THEN** the existing row is replaced (upsert on unique constraint)

#### Scenario: Thief deletion cascades

- **WHEN** a tracked thief is deleted
- **THEN** all associated revelation card rows are deleted

#### Scenario: RLS enforcement

- **WHEN** a user queries revelation cards
- **THEN** only rows belonging to their profile are returned

## ADDED Requirements

### Requirement: Substat value drop migration for revelation rows

A one-time migration SHALL reshape previously persisted revelation substats from objects to bare
stat-id strings so saved rows match the new `subStats: string[]` shape. The migration SHALL rewrite
`p5x_revelation_cards.sub_stats` (JSONB) from an array of `{ type, value }` objects to an array of
the elements' `type` strings, **preserving element order**. The migration SHALL be idempotent: a
row whose `sub_stats` array already holds strings SHALL be left unchanged.

#### Scenario: Object substats reshaped to strings

- **WHEN** a stored card row has `sub_stats = [{ type: 'crit-mult', value: 12 }, { type: 'attack-pct', value: 8 }]`
- **THEN** after migration `sub_stats = ['crit-mult', 'attack-pct']` in the same order

#### Scenario: Migration is idempotent

- **WHEN** the migration runs against a row whose `sub_stats` is already `['crit-mult', 'attack-pct']`
- **THEN** the row is left unchanged
