## MODIFIED Requirements

### Requirement: Per-slot main stat pool

The system SHALL export a `MAIN_STATS` object mapping each slot to its valid main stat options,
expressed as **stat ids** (kebab-case), and a `STAT_LABELS` map resolving each id to its verbatim
in-game label. Each variable pool is ordered per the shared semantic stat ordering (Offensive →
Defensive → Tempo → Supporting; see `shared-ui-components`):

- `SUN`: `['hp']` (fixed)
- `MOON`: `['attack-pct', 'damage-mult', 'hp-pct', 'defense-pct', 'hp-recovery']`
- `STAR`: `['attack-pct', 'crit-rate', 'crit-mult', 'hp-pct', 'defense-pct', 'ailment-acc']`
- `SKY`: `['attack-pct', 'hp-pct', 'defense-pct', 'speed', 'sp-recovery']`
- `SPACE`: `['attack', 'defense']` — **two** fixed main stats (Attack and Defense), both flat
  and non-selectable, not a pick-one pool

`STAT_LABELS` SHALL map: `attack→Attack`, `attack-pct→Attack%`, `defense→Defense`,
`defense-pct→Defense%`, `hp→HP`, `hp-pct→HP%`, `hp-recovery→HP Recovery`,
`damage-mult→Damage Mult. +`, `crit-rate→Crit Rate`,
`crit-mult→Crit Mult.`, `ailment-acc→Ailment Acc.`, `speed→Speed`, `sp-recovery→SP Recovery`,
`pierce-rate→Pierce Rate`.

The Sun (`hp`) and Space (`attack`, `defense`) slots have **fixed** main stats — not chosen from
a pool. Sun has one fixed main; Space has two. The Moon/Star/Sky pools are user-selectable.

Labels SHALL be the verbatim in-game strings: the stat noun stays full and only the trailing
modifier is abbreviated (Multiplier → `Mult.`, Accuracy → `Acc.`); a trailing `%` (no space)
marks only the Attack/Defense/HP percent variants. No label SHALL use build-guide shorthand
(`DMG`, `Multiplier`, `Accuracy`, `ATK`, `DEF`). A `toStatOptions(ids)` helper SHALL map ids to
`{ value, label }` option objects via `STAT_LABELS` for feeding the shared input primitives.

#### Scenario: Sun slot has fixed main stat

- **WHEN** the Sun slot main stat pool is queried
- **THEN** only `'hp'` is available, labelled `HP`

#### Scenario: Star slot has most options

- **WHEN** the Star slot main stat pool is queried
- **THEN** 6 ids are available in semantic order (`attack-pct`, `crit-rate`, `crit-mult`, `hp-pct`,
  `defense-pct`, `ailment-acc`)

#### Scenario: Space slot has two fixed main stats

- **WHEN** the Space slot main stat pool is queried
- **THEN** exactly two fixed ids are present, `'attack'` and `'defense'` (labelled `Attack` and
  `Defense`), representing both fixed mains — neither is user-selectable

#### Scenario: Labels are verbatim in-game strings

- **WHEN** any main stat id is resolved through `STAT_LABELS`
- **THEN** the label matches the in-game string (e.g. `damage-mult` → `Damage Mult. +`,
  `crit-mult` → `Crit Mult.`) and no label contains `Multiplier`, `DMG`, `Accuracy`, `ATK`, or
  `DEF`

### Requirement: Shared substat pool

The system SHALL export a `SUB_STATS` array of **stat ids** containing all valid substat types, in
the shared semantic order (Offensive → Defensive → Tempo → Supporting; see `shared-ui-components`):
`attack`, `attack-pct`, `crit-rate`, `crit-mult`, `damage-mult`, `pierce-rate`, `hp`, `hp-pct`,
`defense`, `defense-pct`, `speed`, `sp-recovery`, `ailment-acc`.

Each id SHALL resolve through `STAT_LABELS` to its verbatim in-game label. Flat and percent
variants remain distinct ids (`attack` → `Attack`, `attack-pct` → `Attack%`). There is a single
multiplier substat, `damage-mult` → `Damage Mult. +`; `Attack Mult.` is a character effect, not a
card substat, and SHALL NOT appear in the pool.

#### Scenario: Substat pool completeness

- **WHEN** the substat pool is queried
- **THEN** it contains exactly 13 stat ids

#### Scenario: Substat pool is in semantic order

- **WHEN** the substat pool is read
- **THEN** offensive ids (`attack`, `attack-pct`, `crit-rate`, `crit-mult`, `damage-mult`,
  `pierce-rate`) precede defensive (`hp`, `hp-pct`, `defense`, `defense-pct`), which precede tempo
  (`speed`, `sp-recovery`), which precede supporting (`ailment-acc`)

#### Scenario: Flat and percent variants distinct

- **WHEN** the substat pool is resolved through `STAT_LABELS`
- **THEN** it contains both `Attack` (id `attack`) and `Attack%` (id `attack-pct`) as separate
  entries

#### Scenario: No Attack Mult. substat

- **WHEN** the substat pool is resolved through `STAT_LABELS`
- **THEN** `Damage Mult. +` (`damage-mult`) is present and no entry is `Attack Mult.`
