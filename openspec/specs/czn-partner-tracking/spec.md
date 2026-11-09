# czn-partner-tracking Specification

## Purpose

Per-combatant Partner tracking for Chaos Zero Nightmare: the equipped Partner (id, level 1–60, Manifest Ego 0–4), the class-scoped Partner picker, the ordered preferred-Partners list, the equipped-vs-preferred match badge, and the card's Partner summary line and edit sections.

## Requirements

### Requirement: Equipped Partner fields

The system SHALL track one equipped Partner per Combatant with three fields: `partnerId` (catalog id or `null`), `partnerLevel` (integer 1–60), and `partnerEgo` (Manifest Ego rank, integer 0–4, where 0 is the base state and 1–4 are the four dupe unlocks). Defaults on add: `null`, 1, 0. Level and Ego updates SHALL be clamped to range before persisting. Existing tracked rows SHALL load with these defaults.

#### Scenario: Partner equipped

- **WHEN** user selects a Partner from the picker
- **THEN** `partnerId` is set to that Partner's id in local state immediately and queued for DB write via debounced save

#### Scenario: Partner unequipped

- **WHEN** user clears the Partner selection
- **THEN** `partnerId` is set to `null`; `partnerLevel` and `partnerEgo` retain their values but are not displayed in the summary

#### Scenario: Partner level and Ego updated

- **WHEN** user sets the Partner level to a value in 1–60 or the Ego rank to 0–4
- **THEN** the value is updated optimistically and queued for DB write; a value outside range is clamped

#### Scenario: Pre-existing row

- **WHEN** a tracked combatant saved before Partner tracking existed is loaded
- **THEN** it carries `partnerId: null`, `partnerLevel: 1`, `partnerEgo: 0`, and an empty preference list

### Requirement: Partner Ego displayed with T prefix

A Partner's Manifest Ego rank SHALL be displayed as `T{n}` (T0–T4) and edited with a single-select rung control, matching the combatant Ego presentation.

#### Scenario: Ego rendered

- **WHEN** the card renders a Partner Ego value `n`
- **THEN** it is shown as `T{n}` (e.g. `T4`)

### Requirement: Partner picker scoped to the Combatant's class

The Partner picker and the preferred-Partners options SHALL offer exactly the catalog Partners whose `class` equals the Combatant's `class`, sorted by rarity descending then name ascending, each labelled `{name} ({rarity}★)`. A currently equipped Partner that falls outside that set (catalog drift) SHALL still appear so the stored value stays visible. The picker SHALL always offer a "No Partner" option first.

#### Scenario: Options filtered by class

- **WHEN** a Striker combatant's card renders its Partner picker
- **THEN** the options are the Striker Partners from the catalog, 5★ first, alphabetical within a rarity, after "No Partner"

#### Scenario: Equipped off-class Partner kept visible

- **WHEN** a combatant's `partnerId` names a Partner whose class no longer matches the combatant's
- **THEN** that Partner is appended to the picker options so the selection still displays and can be changed

#### Scenario: No Partner of that class

- **WHEN** no catalog Partner shares the combatant's class
- **THEN** the picker shows only "No Partner" and the summary renders the empty dash

### Requirement: Preferred Partners list

The system SHALL track an ordered list of preferred Partners per Combatant as `partnerPreferences`: an array of catalog ids, highest priority first, with no duplicates and no comparison operators, defaulting to an empty array on add. It SHALL be persisted as a single ordered array column via the field-update path — never as preference rows. Options are the same class-scoped set as the picker.

#### Scenario: Preference added

- **WHEN** user adds a Partner to the preferred list
- **THEN** its id is appended to `partnerPreferences` and the array is queued for DB write

#### Scenario: Preference reordered or removed

- **WHEN** user moves a preferred Partner up or down, or removes it
- **THEN** `partnerPreferences` reflects the new ranking and is queued for DB write

#### Scenario: Duplicate rejected

- **WHEN** a Partner already in `partnerPreferences` would be added again
- **THEN** the list is unchanged

### Requirement: Equipped-vs-preferred match badge

The card SHALL render a match badge reporting whether the equipped Partner is in `partnerPreferences` and at which rank. Both sides are catalog ids, so the rank is the equipped id's index in the list. Colour SHALL use the shared rust→teal progress language: first choice reads full, lower ranks step toward rust, an equipped Partner absent from a non-empty list reads `Off-build`. The badge SHALL NOT render when the list is empty or no Partner is equipped.

#### Scenario: Equipped Partner is first choice

- **WHEN** `partnerId` equals index 0 of a non-empty `partnerPreferences`
- **THEN** the badge shows `#1` in the full (teal) colour

#### Scenario: Equipped Partner not preferred

- **WHEN** `partnerId` is set and absent from a non-empty `partnerPreferences`
- **THEN** the badge shows `Off-build` in the rust colour

#### Scenario: No preferences or no Partner

- **WHEN** `partnerPreferences` is empty or `partnerId` is `null`
- **THEN** no match badge is rendered

### Requirement: Partner summary line and edit sections

The collapsed card SHALL show one Partner summary line: the Partner's name, `Lv {level}`, `T{ego}`, and the match badge when applicable, or a dimmed dash when no Partner is equipped. The expanded card SHALL present a **Partner** section (picker, level slider 1–60, Ego rung T0–T4) followed by a **Preferred Partners** section (ranked list with add, reorder, remove). Neither editor renders while collapsed.

#### Scenario: Summary with Partner equipped

- **WHEN** a combatant has a Partner equipped at level 60, Ego 2
- **THEN** the collapsed card shows `{name} · Lv 60 · T2` on the summary line

#### Scenario: Summary without Partner

- **WHEN** a combatant has no Partner equipped
- **THEN** the summary line renders a dimmed dash and no match badge

#### Scenario: Editors only in edit mode

- **WHEN** the card is collapsed
- **THEN** neither the Partner picker nor the preferred-Partners list is rendered; both appear when the card is expanded
