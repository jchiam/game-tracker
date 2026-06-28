## Purpose

Arknights: Endfield per-operator tracked fields. Covers level (1–90), phase (0–5), skills-maxed toggle, weapon equipment (name + level), favorite toggle, level-based sort, and search keys (name, class, element, weapon).

## Requirements

### Requirement: Operator level field

The system SHALL track an operator's level as an integer in the range 1–90, defaulting to 1 on add. Updates SHALL be clamped to this range before persisting.

#### Scenario: Level updated within range

- **WHEN** user sets an operator's level to a value between 1 and 90 inclusive
- **THEN** level is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Level clamped below minimum

- **WHEN** user sets an operator's level below 1
- **THEN** level is clamped to 1 before update

#### Scenario: Level clamped above maximum

- **WHEN** user sets an operator's level above 90
- **THEN** level is clamped to 90 before update

### Requirement: Operator phase field

The system SHALL track an operator's phase as an integer in the range 0–5,
defaulting to 0 on add. Updates SHALL be clamped to this range before persisting.
Phase 0 represents an un-invested/base operator; phase 5 is the maximum.

The phase toggle button row SHALL render buttons with equal width using `flex: 1`.
The row container SHALL NOT use `flex-wrap` — all buttons MUST fit on a single line.
This matches the uniform-stretch pattern used by R1999's portrait-row.

#### Scenario: Phase updated within range

- **WHEN** user sets an operator's phase to a value between 0 and 5 inclusive
- **THEN** phase is updated in local state immediately and queued for DB write via debounced save

#### Scenario: Phase clamped below minimum

- **WHEN** user sets an operator's phase below 0
- **THEN** phase is clamped to 0 before update

#### Scenario: Phase clamped above maximum

- **WHEN** user sets an operator's phase above 5
- **THEN** phase is clamped to 5 before update

#### Scenario: Default phase state

- **WHEN** an operator is added to the roster
- **THEN** phase is 0

#### Scenario: Toggle buttons stretch uniformly

- **WHEN** the phase row is rendered
- **THEN** all phase buttons have equal width via `flex: 1` with no wrapping

### Requirement: Operator skills-maxed field

The system SHALL track whether an operator's skills are fully maxed as a single
boolean (`skillsMaxed`), defaulting to false on add. This is an all-or-nothing flag
with no per-skill granularity, mirroring HSR's all-traces-attained toggle. Updates
are optimistic and persisted via debounced save.

#### Scenario: Skills-maxed toggled on

- **WHEN** user toggles the "all skills maxed" control on for an operator
- **THEN** `skillsMaxed` is set to true in local state immediately and queued for DB write

#### Scenario: Skills-maxed toggled off

- **WHEN** user toggles the "all skills maxed" control off
- **THEN** `skillsMaxed` is set to false in local state immediately and queued for DB write

#### Scenario: Default skills-maxed state

- **WHEN** an operator is added to the roster
- **THEN** `skillsMaxed` is false

### Requirement: Operator weapon equipment

The system SHALL track an equipped weapon per operator with two fields:
`weaponName` (string or null — the display name of an entry in `ALL_WEAPONS`) and
`weaponLevel` (integer 1–90). Defaults on add: `weaponName` null, `weaponLevel` 1.
The weapon picker SHALL be filtered to `ALL_WEAPONS` entries whose `type` matches
the operator's intrinsic `weapon` class. `weaponLevel` updates SHALL be clamped to
1–90 before persisting.

#### Scenario: Weapon picker filtered by class

- **WHEN** the operator card edit body renders the weapon picker
- **THEN** the dropdown lists only weapons whose `type` equals the operator's `weapon` value, plus a "No Weapon" option

#### Scenario: Weapon equipped

- **WHEN** user selects a weapon from the picker
- **THEN** `weaponName` is set to the selected weapon's display name and queued for DB write

#### Scenario: Weapon level updated

- **WHEN** user sets the weapon level to a value between 1 and 90
- **THEN** `weaponLevel` is updated in local state and queued for DB write, clamped to 1–90

#### Scenario: Weapon cleared

- **WHEN** user selects the "No Weapon" option
- **THEN** `weaponName` is set to null and queued for DB write; `weaponLevel` is left unchanged

#### Scenario: Default weapon state

- **WHEN** an operator is added to the roster
- **THEN** `weaponName` is null and `weaponLevel` is 1

### Requirement: Favorite toggle

The system SHALL allow toggling the favorite status of a tracked operator. Updates are optimistic and persisted via debounced save.

#### Scenario: Favorite toggled

- **WHEN** user toggles favorite on an operator
- **THEN** `isFavorited` is updated in local state immediately and queued for DB write

### Requirement: Endfield roster sort by level

The system SHALL support sorting the Endfield roster by operator level (descending) in addition to the standard alphabetical sort.

#### Scenario: Sort by level selected

- **WHEN** user selects level sort
- **THEN** roster is ordered by level descending, with favorited-first still applied as the primary sort key

#### Scenario: Sort by alpha selected

- **WHEN** user selects alphabetical sort
- **THEN** standard favorited-first + alpha sort from the roster spec is applied with no level comparator

### Requirement: Endfield roster search keys

The system SHALL search the Endfield roster using Fuse.js with keys: name, class, element, weapon.

#### Scenario: Search by class

- **WHEN** user searches for a class name (e.g., Guard, Caster)
- **THEN** operators matching that class are returned via fuzzy search

#### Scenario: Search by element

- **WHEN** user searches for an element name (e.g., Heat, Cryo)
- **THEN** operators matching that element are returned via fuzzy search

#### Scenario: Search by weapon

- **WHEN** user searches for a weapon type (e.g., Sword, Polearm)
- **THEN** operators matching that weapon type are returned via fuzzy search

### Requirement: Operator card collapsed-summary composition

The collapsed (read-only) state of the operator card SHALL present investment as
gradient-colored stat chips, and the expanded (edit) state SHALL drive its level
and weapon-level sliders with the same shared investment gradient. The card SHALL
use the shared `getProgressStyle(value, min, max)` color language (rust → teal) so
AE matches HSR, R1999, and N2E. Because AE operators now track an equipped weapon,
the card SHALL render a `.game-card-static-line` gear one-liner for the equipped
weapon (name + level), matching the R1999 psychube line. The card SHALL NOT render
a rarity-star indicator.

#### Scenario: Level chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `Lv {level}` `StatChip` text and border color are computed via `getProgressStyle(level, 1, 90)`, so a low-level operator reads rust and a level-90 operator reads teal

#### Scenario: Phase chip colored by investment

- **WHEN** an operator card renders its collapsed summary
- **THEN** the `P{phase}` `StatChip` text and border color are computed via `getProgressStyle(phase, 0, 5)`

#### Scenario: Skills chip reflects maxed state

- **WHEN** an operator card renders its collapsed summary
- **THEN** a `Skills {✓|✗}` `StatChip` is shown, colored via `getProgressStyle(skillsMaxed ? 1 : 0, 0, 1)`

#### Scenario: Level slider uses the canonical class and shared gradient

- **WHEN** an operator card's edit body renders the level slider
- **THEN** the input uses the canonical `.level-slider` class and sets `--slider-fill-color` and `--slider-fill-glow` from `getProgressStyle(level, 1, 90)`, with the track fill percentage computed as `(level − 1) / 89`

#### Scenario: Equipped-weapon gear one-liner present

- **WHEN** an operator card renders its collapsed summary and a weapon is equipped
- **THEN** a `.game-card-static-line` shows the weapon name and `Lv {weaponLevel}`, colored via the shared gradient like the R1999 psychube line

#### Scenario: No weapon equipped

- **WHEN** an operator card renders its collapsed summary and no weapon is equipped
- **THEN** the `.game-card-static-line` shows an em-dash placeholder in the rust (empty) color

#### Scenario: No rarity-star indicator

- **WHEN** an operator card renders
- **THEN** no `.rarity-indicator` element is present; rarity remains a catalog field but is not displayed on the card

### Requirement: Operator weapon preferences

The system SHALL track an ordered list of preferred weapons per operator as
`weaponPreferences`: an array of `ALL_WEAPONS` **ids** (string slugs), highest priority
first. The list is a pure ranking — there are no comparison operators between entries —
and SHALL NOT contain duplicate ids. It defaults to an empty array on add. The list is
persisted via the operator field-update path as a single ordered array (see
shared-save-behaviour; this field is NOT subject to the non-atomic delete-then-reinsert
limitation). Order is significant: index 0 is the first choice.

#### Scenario: Preference added

- **WHEN** user adds a weapon to the operator's preferred list
- **THEN** the weapon's `id` is appended to `weaponPreferences` and the array is queued for DB write via debounced save

#### Scenario: Preference removed

- **WHEN** user removes a weapon from the preferred list
- **THEN** that id is removed from `weaponPreferences`, remaining ids keep their relative order, and the array is queued for DB write

#### Scenario: Preference reordered

- **WHEN** user moves a preferred weapon up or down in the list
- **THEN** `weaponPreferences` is reordered to the new ranking and queued for DB write

#### Scenario: Duplicate rejected

- **WHEN** a weapon already present in `weaponPreferences` would be added again
- **THEN** the list is unchanged (a weapon id appears at most once)

#### Scenario: Picker scoped to operator weapon class

- **WHEN** the preferred-weapon editor renders its options
- **THEN** the selectable set is exactly `ALL_WEAPONS.filter(w => w.type === operator.weapon)`, presented as `{ value: id, label: "{name} ({rarity}★)" }` so the persisted value is the id and the shown text matches the equipped-weapon picker's label exactly

#### Scenario: Preferred-weapon dropdown matches the equipped-weapon picker

- **WHEN** the preferred-weapon editor renders a row's dropdown
- **THEN** the `<select>` uses the shared `.game-select` control (same border, background, and chevron as the equipped-weapon picker) and lists the same class-scoped weapons with the same `{name} ({rarity}★)` labels

#### Scenario: Default preferences state

- **WHEN** an operator is added to the roster
- **THEN** `weaponPreferences` is an empty array

### Requirement: Equipped-weapon preference match badge

The system SHALL render a match badge on the operator card that reports whether the
equipped weapon is one of the operator's preferred weapons and, if so, how highly it
ranks. Because the equipped weapon is stored as `weaponName` (display name) and
preferences are stored as ids, the badge SHALL resolve the equipped name to an id via
`ALL_WEAPONS` before locating its rank in `weaponPreferences`. The badge color SHALL use
the shared `getProgressStyle` rust→teal language, with the first-choice weapon reading
full (teal) and lower ranks stepping toward rust. Any resolution failure SHALL degrade
to the off-build state, never throw.

#### Scenario: Equipped weapon is first choice

- **WHEN** the equipped weapon resolves to the id at index 0 of `weaponPreferences`
- **THEN** the badge shows the top rank (e.g. `#1`) colored full/teal via `getProgressStyle(listLength, 0, listLength)`

#### Scenario: Equipped weapon is a lower-ranked choice

- **WHEN** the equipped weapon resolves to an id at index `rank` (> 0) of `weaponPreferences`
- **THEN** the badge shows that rank (e.g. `#2`) colored via `getProgressStyle(listLength - rank, 0, listLength)`, warmer than rust but below first choice

#### Scenario: Equipped weapon not in preference list

- **WHEN** a weapon is equipped, preferences exist, and the equipped id is not found in `weaponPreferences` (including when `weaponName` does not resolve to any `ALL_WEAPONS` entry)
- **THEN** the badge shows an off-build state in the rust (lowest) color

#### Scenario: No preferences set

- **WHEN** `weaponPreferences` is empty
- **THEN** no match badge is rendered, regardless of whether a weapon is equipped

#### Scenario: No weapon equipped

- **WHEN** preferences exist but `weaponName` is null
- **THEN** no match badge is rendered

### Requirement: Weapon preferences edit-body editor

The expanded (edit) state of the operator card SHALL present a preferred-weapons editor
using the shared `PreferenceChain` component in ranked-list mode, scoped to the
operator's weapon class. The collapsed (read-only) state SHALL NOT render the editor;
the match badge is the only preference signal in the collapsed summary.

#### Scenario: Editor present in edit body

- **WHEN** the operator card is expanded
- **THEN** a preferred-weapons editor renders the current `weaponPreferences` as an ordered, reorderable list with per-item remove and an add control, options scoped to the operator's weapon class

#### Scenario: Editor absent in collapsed summary

- **WHEN** the operator card is collapsed
- **THEN** no preferred-weapons editor is rendered

### Requirement: Edit body grows to fit the weapon-preference list

The system SHALL size the operator card's edit-body height budget
(`--game-card-edit-max-height`) from the editor's actual rendered content height rather
than a fixed value. The edit body is height-capped to drive its expand/collapse
transition, and the preferred-weapons editor grows by one row per added weapon, so a
fixed budget would clip the list; sizing from measured content makes the expanded card
lengthen to fit, keeping the bottom of the editor and its padding visible for any number
of preferred weapons.

#### Scenario: Card lengthens as weapons are added

- **WHEN** the card is expanded and the user adds preferred weapons to the list
- **THEN** the edit-body height budget grows to the measured content height so the full editor and its bottom padding remain visible (no clipping)

#### Scenario: Card shrinks as weapons are removed

- **WHEN** preferred weapons are removed from the list
- **THEN** the edit-body height budget shrinks back to the measured content height
