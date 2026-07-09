## Purpose

Persona 5: The Phantom X (P5X) per-Thief tracked fields. Covers level (1–80),
Awareness (0–6 duplicate ranks, shown as A0–A6), weapon investment (rarity, level,
forge), Mindscape completion, aggregate skill progress (two coupled booleans —
skills leveled to the Lv8 incense cap and rose-maxed past the gate to Lv10 — with
a rose-gated derived state), favorite toggle, level-based sort, search keys (name,
codename, personaName, role, element), revelation card summary chip, revelation
editor modal, and the Thief card's collapsed-summary composition
(investment-gradient chips, role/element badges, bound-Persona static line, no
rarity indicator). Edit sections and summary chips follow the dimension ordering:
Level → Weapon → Revelations → Mindscape → Skills.

## Requirements

### Requirement: Thief level field

The system SHALL track a Thief's level as an integer in the range 1–80, defaulting
to 1 on add. Updates SHALL be clamped to this range before persisting. 80 is the
current live-game cap; a future cap raise is a paired slider-max + DB CHECK change.

#### Scenario: Level updated within range

- **WHEN** user sets a Thief's level to a value between 1 and 80 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets a Thief's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets a Thief's level above 80
- **THEN** level is clamped to 80 before update

### Requirement: Thief awareness field

The system SHALL track a Thief's Awareness (duplicate rank) as an integer in the
range 0–6, defaulting to 0 on add. Updates SHALL be clamped to this range before
persisting. Awareness 0 represents no duplicates; 6 is the maximum. The UI SHALL
present ranks as `A0`–`A6`.

The awareness control SHALL be a `SegmentedButtons` row with investment coloring.
Buttons SHALL stretch to equal width via `flex: 1` with no wrapping — all seven
buttons fit on a single line, matching the uniform-stretch pattern used by AE's
phase row and R1999's portrait row.

#### Scenario: Awareness updated within range

- **WHEN** user sets a Thief's awareness to a value between 0 and 6 inclusive
- **THEN** awareness is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Awareness clamped to range

- **WHEN** user sets a Thief's awareness below 0 or above 6
- **THEN** awareness is clamped to 0 or 6 respectively before update

#### Scenario: Default awareness state

- **WHEN** a Thief is added to the roster
- **THEN** awareness is 0

#### Scenario: Toggle buttons stretch uniformly

- **WHEN** the awareness row is rendered
- **THEN** all seven buttons (A0–A6) have equal width via `flex: 1` with no wrapping

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked Thief. Updates are
optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on a Thief
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: P5X roster sort by level

The system SHALL support sorting the P5X roster by Thief level (descending) in
addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level comparator

### Requirement: P5X roster search keys

The system SHALL search the P5X roster using Fuse.js with keys: name, codename,
personaName, role, element.

#### Scenario: Search by codename

- **WHEN** user searches for a codename (e.g., Panther, Joker)
- **THEN** Thieves matching that codename are returned via fuzzy search

#### Scenario: Search by Persona name

- **WHEN** user searches for a Persona name (e.g., Arsene)
- **THEN** Thieves whose bound Persona matches are returned via fuzzy search

#### Scenario: Search by role

- **WHEN** user searches for a role name (e.g., Healer, Debuffer)
- **THEN** Thieves matching that role are returned via fuzzy search

#### Scenario: Search by element

- **WHEN** user searches for an element name (e.g., Nuclear, Bless)
- **THEN** Thieves matching that element are returned via fuzzy search

### Requirement: Thief card collapsed-summary composition

The collapsed (read-only) state of the Thief card SHALL present investment as
gradient-colored stat chips using the shared `getProgressStyle(value, min, max)`
color language (rust → teal), matching the other four games. The card SHALL render
the Thief's role and element as `GameBadge`s and the bound Persona's name as a
static line. The card SHALL NOT render a rarity-star indicator (rarity remains a
catalog field, matching AE).

When revelations are equipped, the summary SHALL show a revelation chip displaying
the Heavens set name (e.g. "Strife 4pc") colored via investment gradient. If a
Space set is also equipped, it SHALL be appended (e.g. "Strife 4pc + Meditation").
Dimension ordering for chips: Level → Weapon → Revelations → Mindscape → Skills.

#### Scenario: Level chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 80)`

#### Scenario: Awareness chip colored by investment

- **WHEN** a Thief card renders its collapsed summary
- **THEN** an `A{awareness}` `StatChip` is shown, colored via `getProgressStyle(awareness, 0, 6)`

#### Scenario: Persona name line present

- **WHEN** a Thief card renders
- **THEN** the bound Persona's name is shown as a static line in the card body

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** a Thief card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 80)`, with the track fill percentage computed as `(level − 1) / 79`

#### Scenario: No rarity-star indicator

- **WHEN** a Thief card renders
- **THEN** no `.rarity-indicator` element is present

#### Scenario: Revelation set chip shown when cards equipped

- **WHEN** a Thief has at least one Heavens card equipped with a set
- **THEN** a `StatChip` shows the Heavens set name with "Xpc" suffix (count of cards with that set) colored via investment gradient (progress = equipped count / 4 for Heavens)

#### Scenario: Space set appended to chip

- **WHEN** a Thief has a Space card equipped with a set AND a Heavens 4pc
- **THEN** the revelation chip shows "{Heavens} 4pc + {Space}"

#### Scenario: No revelation chip when empty

- **WHEN** a Thief has no revelation cards equipped
- **THEN** no revelation chip is shown in the summary

#### Scenario: Dimension ordering includes revelations

- **WHEN** the summary stat chips render
- **THEN** order is: Level → Awareness → Weapon → Revelations → Mindscape → Skills

### Requirement: Thief aggregate skill-progress fields

The system SHALL track a Thief's Persona skill progress as two boolean fields —
`skillsLeveled` (skills brought up to the level-8 incense cap) and `roseMaxed`
(pushed past the rose gate from 8 to the level-10 max) — both defaulting to `false`
on add. Progress is tracked in **aggregate** for the Thief, not per individual skill.
Updates are optimistic and persisted via debounced save.

#### Scenario: Default skill-progress state

- **WHEN** a Thief is added to the roster
- **THEN** `skillsLeveled` is `false` and `roseMaxed` is `false`

#### Scenario: Mark skills leveled

- **WHEN** user marks a Thief's skills as leveled
- **THEN** `skillsLeveled` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Mark rose maxed

- **WHEN** user marks a Thief's skills as rose-maxed
- **THEN** `roseMaxed` is set to `true` and `skillsLeveled` is `true`, and both are queued for DB write in one patch

### Requirement: Skill-progress invariant

The system SHALL prevent the invalid state where `roseMaxed` is `true` while
`skillsLeveled` is `false`. The invariant SHALL be enforced at the interaction layer
(coupled toggles), the hook updater (which normalizes against current state), and the
database (a `CHECK` constraint on `p5x_tracked_thieves`).

#### Scenario: Enabling rose implies leveled

- **WHEN** user sets `roseMaxed` to `true` on a Thief whose `skillsLeveled` is `false`
- **THEN** `skillsLeveled` is coerced to `true` in the same update so the persisted state is `(true, true)`

#### Scenario: Clearing leveled clears rose

- **WHEN** user sets `skillsLeveled` to `false` on a Thief whose `roseMaxed` is `true`
- **THEN** `roseMaxed` is coerced to `false` in the same update so the persisted state is `(false, false)`

#### Scenario: Database rejects the invalid combination

- **WHEN** a row with `rose_maxed = true` and `skills_leveled = false` is written to `p5x_tracked_thieves`
- **THEN** the `CHECK` constraint rejects the write

### Requirement: Rose-gated summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a **rose-gated** state
as `skillsLeveled && !roseMaxed` and present it as a distinct 🌹 badge among the
summary chips. When `roseMaxed` is `true`, the card SHALL instead present a
"skills maxed" indicator. When both fields are `false`, the card SHALL present no
skill indicator, keeping the untouched card uncluttered.

#### Scenario: Rose-gated badge shown

- **WHEN** a Thief card renders its collapsed summary with `skillsLeveled` `true` and `roseMaxed` `false`
- **THEN** a 🌹 rose-gated badge is shown

#### Scenario: Maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `roseMaxed` `true`
- **THEN** a "skills maxed" indicator is shown and no rose-gated badge is present

#### Scenario: No indicator when untouched

- **WHEN** a Thief card renders its collapsed summary with both `skillsLeveled` and `roseMaxed` `false`
- **THEN** no skill indicator is present

### Requirement: Skill-progress edit controls

The Thief card's edit body SHALL provide two coupled toggle controls for skill
progress, rendered in a "Skills" `ProgressSection` below the Mindscape section. The
toggles SHALL be self-styled (not `.btn`) and SHALL enforce the coupling described in
the skill-progress invariant so no interaction can produce the invalid combination.

#### Scenario: Skills section rendered below Mindscape

- **WHEN** a Thief card's edit body renders
- **THEN** a "Skills" `ProgressSection` with the two toggles appears below the Mindscape `ProgressSection`

#### Scenario: Toggle invokes skill-progress updater

- **WHEN** user activates either skill toggle
- **THEN** the card invokes the skill-progress update handler with the normalized `skillsLeveled` / `roseMaxed` values

### Requirement: Rose-gated roster filter

The P5X roster toolbar SHALL render a "🌹 Gated" filter chip that, when active,
narrows the displayed roster to only thieves in the rose-gated state
(`skillsLeveled && !roseMaxed`). The chip composes with existing search and sort.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders
- **THEN** a "🌹 Gated" filter chip is visible in the toolbar area

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "🌹 Gated" filter chip
- **THEN** only thieves with `skillsLeveled === true` and `roseMaxed === false` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "🌹 Gated" filter chip
- **THEN** all tracked thieves (matching current search/sort) are shown again

#### Scenario: Filter composes with level sort

- **WHEN** the rose-gate filter is active and sort is set to LEVEL
- **THEN** only rose-gated thieves are shown, sorted by level descending (favorites first)

#### Scenario: Filter composes with search

- **WHEN** the rose-gate filter is active and user searches "fire"
- **THEN** only rose-gated thieves matching "fire" are shown

#### Scenario: Empty state when no thieves are rose-gated

- **WHEN** the rose-gate filter is active but no thieves have `skillsLeveled && !roseMaxed`
- **THEN** an empty state message is shown (e.g., "No rose-gated thieves")

### Requirement: Thief Mindscape maxed field

The system SHALL track a Thief's Mindscape completion as a boolean field
`mindscapeMaxed`, defaulting to `false` on add. When `true`, the thief's
entire Mindscape node tree is fully unlocked. Updates are optimistic and
persisted via debounced save.

#### Scenario: Default mindscape state

- **WHEN** a Thief is added to the roster
- **THEN** `mindscapeMaxed` is `false`

#### Scenario: Mark mindscape maxed

- **WHEN** user marks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `true` in local state immediately and queued for DB write via debounced save

#### Scenario: Unmark mindscape maxed

- **WHEN** user unmarks a Thief's Mindscape as maxed
- **THEN** `mindscapeMaxed` is set to `false` in local state immediately and queued for DB write via debounced save

### Requirement: Mindscape summary indicator

The collapsed (read-only) state of the Thief card SHALL derive a visual
indicator from `mindscapeMaxed`. When `true`, a "MS ✓" chip or equivalent
SHALL appear among the summary chips. When `false`, no Mindscape indicator
is shown, keeping the untouched card uncluttered.

#### Scenario: Mindscape maxed indicator shown

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `true`
- **THEN** a Mindscape completion indicator is shown among the summary chips

#### Scenario: No indicator when not maxed

- **WHEN** a Thief card renders its collapsed summary with `mindscapeMaxed` `false`
- **THEN** no Mindscape indicator is present

### Requirement: Mindscape edit toggle

The Thief card's edit body SHALL provide a toggle control for Mindscape
completion, rendered in a "Mindscape" `ProgressSection` below the Weapon
section. The toggle SHALL be self-styled (not `.btn`).

#### Scenario: Mindscape section rendered below Weapon

- **WHEN** a Thief card's edit body renders
- **THEN** a "Mindscape" `ProgressSection` with the maxed toggle appears below the Weapon section

#### Scenario: Toggle invokes mindscape updater

- **WHEN** user activates the Mindscape toggle
- **THEN** the card invokes the field update handler with the new `mindscapeMaxed` value

### Requirement: Weapon rarity field

The system SHALL track the rarity of a Thief's equipped weapon as a nullable
integer in the set {2, 3, 4, 5}, defaulting to `null` on add. A `null` value
means the user has not started tracking weapon investment for this Thief.
Setting a rarity activates the weapon section (summary chip + edit controls).

#### Scenario: Default weapon rarity state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponRarity` is `null`

#### Scenario: Weapon rarity set

- **WHEN** user selects a weapon rarity (2, 3, 4, or 5)
- **THEN** `weaponRarity` is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon rarity cleared via allowDeselect

- **WHEN** user deselects the active rarity button
- **THEN** `weaponRarity` is set to `null`, hiding the weapon summary chip

### Requirement: Weapon level field

The system SHALL track the level of a Thief's weapon as an integer in the range
1–80, defaulting to 1 on add. Updates SHALL be clamped to this range before
persisting. Weapon level is shared across all weapons on the same Thief in-game,
so this is effectively a per-Thief stat.

#### Scenario: Weapon level updated within range

- **WHEN** user sets a Thief's weapon level to a value between 1 and 80 inclusive
- **THEN** weapon level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon level clamped below minimum

- **WHEN** user sets a Thief's weapon level below 1
- **THEN** weapon level is clamped to 1 before update

#### Scenario: Weapon level clamped above maximum

- **WHEN** user sets a Thief's weapon level above 80
- **THEN** weapon level is clamped to 80 before update

### Requirement: Weapon forge field

The system SHALL track the forge level (dupe-based upgrade) of a Thief's
equipped weapon as an integer in the range 0–6, defaulting to 0 on add.
Updates SHALL be clamped to this range before persisting.

#### Scenario: Default weapon forge state

- **WHEN** a Thief is added to the roster
- **THEN** `weaponForge` is 0

#### Scenario: Weapon forge updated within range

- **WHEN** user sets a Thief's weapon forge to a value between 0 and 6 inclusive
- **THEN** weapon forge is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Weapon forge clamped to range

- **WHEN** user sets a Thief's weapon forge below 0 or above 6
- **THEN** weapon forge is clamped to 0 or 6 respectively before update

### Requirement: Weapon summary chip

The collapsed (read-only) state of the Thief card SHALL present weapon
investment as a single `StatChip` when `weaponRarity` is not `null`. The chip
SHALL display the equipped rarity and forge level (e.g., `⚔ 5★ F4`). The chip
color SHALL use `getProgressStyle` based on forge (0–6) to match the
investment-gradient language used by other chips. When `weaponRarity` is `null`,
no weapon chip is shown.

#### Scenario: Weapon chip shown when rarity set

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` set (e.g., 5) and `weaponForge` at 4
- **THEN** a `StatChip` with label `⚔ 5★ F4` is shown, colored via `getProgressStyle(weaponForge, 0, 6)`

#### Scenario: No weapon chip when rarity null

- **WHEN** a Thief card renders its collapsed summary with `weaponRarity` `null`
- **THEN** no weapon `StatChip` is present

### Requirement: Weapon edit section

The Thief card's edit body SHALL provide a "Weapon" `ProgressSection` after the
Awareness section, containing three controls:

1. **Rarity** — `SegmentedButtons` with options 2★, 3★, 4★, 5★ using
   `coloring="static"` and `allowDeselect` (clearing sets `weaponRarity` to
   `null`). Each option uses a rarity modifier class for per-star color coding.
2. **Level** — `LevelSlider` (1–80) with `getProgressStyle(weaponLevel, 1, 80)`
   gradient fill, matching the thief level slider.
3. **Forge** — `SegmentedButtons` with options F0–F6 using
   `coloring="investment"`, matching the awareness segmented-buttons pattern.

#### Scenario: Weapon section rendered after Awareness

- **WHEN** a Thief card's edit body renders
- **THEN** a "Weapon" `ProgressSection` appears below the Awareness section

#### Scenario: Rarity buttons use static coloring with allowDeselect

- **WHEN** the weapon rarity control renders
- **THEN** it is a `SegmentedButtons` with `coloring="static"`, `allowDeselect`, and four options (2★–5★)

#### Scenario: Level slider shows weapon level

- **WHEN** the weapon level slider renders
- **THEN** it uses `LevelSlider` with min=1, max=80, value=`weaponLevel`

#### Scenario: Forge buttons use investment coloring

- **WHEN** the weapon forge control renders
- **THEN** it is a `SegmentedButtons` with `coloring="investment"` and seven options (F0–F6)

#### Scenario: Weapon section value label reflects state

- **WHEN** `weaponRarity` is set (e.g., 5) with `weaponLevel` 45 and `weaponForge` 4
- **THEN** the `ProgressSection` value displays `5★ · Lv 45 · F4`
- **WHEN** `weaponRarity` is `null`
- **THEN** the `ProgressSection` value displays `—`

### Requirement: Revelation editor modal

The system SHALL provide a `RevelationEditorModal` opened from the Thief card
(via an edit-toggle button or dedicated "Revelations" button in the card's edit
body). The modal SHALL follow the canonical build-preference editor modal layout
pattern defined in the `shared-ui-components` spec — `Modal` shell, `.modal-tabs`
with `.tab-btn` for "Equip Cards" and "Build Preferences" tabs, a
`.revelation-editor-body` flex-column container, and `FormGroup` components as
direct children of the body (no intermediate wrapper divs). Per-game CSS SHALL
define only the body layout rule.

The modal SHALL receive the current thief, and callbacks for slot updates and
preference saves. It SHALL NOT be inline in the card's edit collapse body.

#### Scenario: Modal opens from card

- **WHEN** user clicks the revelation editor trigger on a Thief card
- **THEN** the `RevelationEditorModal` opens showing the Equip tab by default

#### Scenario: Modal closes

- **WHEN** user clicks close or the overlay
- **THEN** the modal closes and no state is lost (changes are saved on interaction, not on close)

#### Scenario: Tab switching

- **WHEN** user clicks the "Preferences" tab
- **THEN** the preferences panel is shown; clicking "Equip" returns to the slot editors

### Requirement: Revelation modal — Equip tab

The Equip tab SHALL render per-slot card editors for all 5 slots (Sun, Moon, Star,
Sky, Space). Each slot editor presents: a `Select` for the set (Heavens catalog for
sun/moon/star/sky; Space catalog for space), a `Select` for main stat (filtered by
slot from `MAIN_STATS`; disabled for Sun and Space since they're fixed), and a
`SubStatList` for substats (stat-value variant, max 4 entries, stat options from
`SUB_STATS` pool excluding the card's main stat).

#### Scenario: Slot editor renders set dropdown

- **WHEN** the Equip tab renders a Heavens slot
- **THEN** a `Select` dropdown lists all Heavens sets plus a "None" option

#### Scenario: Main stat dropdown respects slot

- **WHEN** the Moon slot editor renders its main stat dropdown
- **THEN** only Moon-valid main stats are listed (ATK%, DEF%, HP%, HP Recovery%, DMG Multiplier%)

#### Scenario: Sun slot main stat is fixed

- **WHEN** the Sun slot editor renders
- **THEN** main stat is displayed as "Flat HP" without a dropdown (or a disabled dropdown)

#### Scenario: Substats exclude main stat

- **WHEN** a Moon card has main stat "ATK%"
- **THEN** the substat picker excludes "ATK%" from available options

#### Scenario: Substat limit enforced

- **WHEN** a card already has 4 substats
- **THEN** no additional substats can be added

### Requirement: Revelation modal — Preferences tab

The Preferences tab SHALL contain: preferred Heavens set (`Select`), preferred
Space set (`Select`), main stat `PreferenceChain` for Moon/Star/Sky (each filtered
to the slot's valid main stats), and a substat `PreferenceChain` (full `SUB_STATS`
pool).

#### Scenario: Preferred set dropdowns

- **WHEN** the Preferences tab renders
- **THEN** Heavens and Space set dropdowns show all sets from their respective catalogs

#### Scenario: Main stat chain for Star slot

- **WHEN** user edits Star main stat preferences
- **THEN** only Star-valid stats are offered in the chain picker (ATK%, DEF%, HP%, Crit Rate%, Crit Multiplier%, Ailment Accuracy%)

#### Scenario: Substat preference chain

- **WHEN** user edits substat preferences
- **THEN** all 13 substats from the shared pool are available in the chain picker
