## MODIFIED Requirements

### Requirement: Per-thief revelation state shape

The system SHALL track a `revelations` object on each `P5xTrackedThief` with five nullable slots: `sun`, `moon`, `star`, `sky`, `space`. Each slot holds an `EquippedRevelation | null`. An `EquippedRevelation` SHALL contain: `setId: string | null`, `mainStat: string | null`, `subStats: RevelationStat[]` (max 4 entries). A `RevelationStat` is `{ type: string, value: number }`.

`mainStat` and `RevelationStat.type` SHALL store a **stat id** (from `MAIN_STATS` / `SUB_STATS`),
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
- **THEN** `mainStat` stores `damage-mult` and the substat `type` stores `crit-mult`, and both
  render through `STAT_LABELS` as `Damage Mult. +` / `Crit Mult.`

#### Scenario: Space card mains are fixed and derived

- **WHEN** a Space card is equipped
- **THEN** its `mainStat` is `null`, and the editor/summary display its two fixed mains as `Attack`
  and `Defense` derived from `MAIN_STATS.SPACE`, not from stored values

## ADDED Requirements

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
