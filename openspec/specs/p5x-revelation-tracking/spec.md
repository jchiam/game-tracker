## Purpose

Per-thief Revelation Card equipped state: the 5-slot gear model (Sun, Moon, Star,
Sky, Space), slot updates, DB schema, load/save lifecycle. Covers the "what is
equipped" axis; build preferences live in `p5x-revelation-preferences`.
## Requirements
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

### Requirement: Revelation slot update

The system SHALL allow updating a single revelation slot independently. Updates SHALL be optimistic (local state first) and queued for DB write via `usePendingSaves`. The update payload specifies the slot key and the new `EquippedRevelation` value (or `null` to clear).

#### Scenario: Equip a card in a slot

- **WHEN** user sets a revelation slot (e.g. `sun`) to a new `EquippedRevelation`
- **THEN** local state updates immediately and a DB write is queued

#### Scenario: Clear a slot

- **WHEN** user clears a revelation slot
- **THEN** slot becomes `null` in local state and DB write is queued

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

### Requirement: Stat id backfill for existing revelation rows

A one-time migration SHALL rewrite previously persisted P5X stat **label strings** to the new stat
**ids** so no saved row is orphaned by the id/label decoupling. The migration SHALL cover:

- `p5x_revelation_cards.main_stat` (TEXT) — replaced per the old-string → id map.
- `p5x_revelation_cards.sub_stats` (JSONB array of `{type, value}`) — each element's `type`
  rewritten per the map, values preserved.
- `p5x_revelation_preferences.stat` (TEXT) — rewritten **only** where `category` is one of
  `moon_main`, `star_main`, `sky_main`, `sub_stats`; the `heavens_set` / `space_set` categories
  store set ids and SHALL be left untouched.

The old-string → id map is: `ATK→attack`, `ATK%→attack-pct`, `DEF→defense`, `DEF%→defense-pct`,
`HP→hp`, `HP%→hp-pct`, `HP Recovery%→hp-recovery`, `DMG Multiplier%→damage-mult`,
`Ailment Accuracy%→ailment-acc`, `Crit Rate%→crit-rate`, `Crit Multiplier%→crit-mult`,
`Speed→speed`, `SP Recovery%→sp-recovery`, `Pierce Rate%→pierce-rate`.

The obsolete Space main string `'ATK & DEF'` has no id (Space mains are now fixed and derived, not
stored): the migration SHALL set `main_stat = NULL` for any `p5x_revelation_cards` row whose `slot`
is `space` (or whose `main_stat` is `'ATK & DEF'`).

#### Scenario: Card main and sub stats migrated

- **WHEN** a stored card row has `main_stat = 'DMG Multiplier%'` and a sub_stats element
  `{ type: 'Crit Multiplier%', value: 12 }`
- **THEN** after migration `main_stat = 'damage-mult'` and the element is `{ type: 'crit-mult',
value: 12 }`

#### Scenario: Space card main nulled

- **WHEN** a stored Space card row has `main_stat = 'ATK & DEF'`
- **THEN** after migration its `main_stat` is `NULL` and its `sub_stats` are still rewritten to ids

#### Scenario: Set preference rows untouched

- **WHEN** a preference row has `category = 'heavens_set'` and `stat = 'strife'`
- **THEN** the migration leaves `stat` unchanged

#### Scenario: No old label strings remain

- **WHEN** the migration completes
- **THEN** no `main_stat`, `sub_stats[].type`, or main/sub-category preference `stat` holds any old
  label string from the map's left column

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

