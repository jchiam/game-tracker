# shared-ui-components Specification

## Purpose

The L3 shared-component contracts — the class/prop surface of the reusable UI components whose
behaviour is not already owned by another capability: `GameCardShell`, `StatChip`,
`ProgressSection`, `Modal`, `GameSwitcher`, `Navbar`, `ConfirmCheckbox`, and `PreferenceChain`. Components specced
behaviourally elsewhere are referenced, not redeclared: `AuthGate` (`shared-auth`), `SavingToast`
/ `ToastContainer` (`shared-save-behaviour`), `RosterPageLayout` / `LoadErrorState`
(`shared-roster`), and `GameBadge` (`shared-card-badges`).

## Requirements

### Requirement: GameCardShell provides the shared roster-card structure

The shared `GameCardShell` component SHALL render the structural shell of every game's roster card
over the canonical `.game-card-*` skeleton (`shared-card-base`) and collapse mechanism
(`shared-card-collapse`): the header image resolved via `getMugshotUrl` with a loading spinner
while loading and a ui-avatars fallback on error, favorite and remove buttons titled
`Favorite {entityNoun}` / `Unfavorite {entityNoun}` / `Remove {entityNoun}`, an edit toggle titled
`Edit` / `Done editing`, and the summary ⇄ edit-body collapse driven by the `is-editing` class,
with both height budgets measured by the shell (`shared-card-collapse`). Game content SHALL enter
only through named slots: `badges` (rendered inside `.game-card-badges`), optional `headerExtra`
(rendered inside `.game-card-header-actions`, left of the edit toggle), `summaryStats`,
`summaryLine`, and `editBody`. Remaining props: `name` (card title and image alt), `imageUrl`
(catalog path), `entityNoun` (capitalised), `isFavorited`, `onToggleFavorite((value: boolean) =>
void)` invoked with the inverted value, and `onRemove(e)`. Game cards SHALL compose `GameCardShell`
rather than re-implementing the header, controls, or collapse mechanics.

#### Scenario: Slots render in their structural containers

- **WHEN** `GameCardShell` is rendered with slot content
- **THEN** `badges` appears inside `.game-card-badges`, `headerExtra` inside
  `.game-card-header-actions`, `summaryStats` inside `.game-card-static-stats`, `summaryLine`
  inside `.game-card-static-line`, and `editBody` inside `.game-card-edit-body-inner`

#### Scenario: Buttons titled with the entity noun

- **WHEN** the shell is rendered with `entityNoun="Arcanist"`
- **THEN** the controls are titled `Favorite Arcanist` (or `Unfavorite Arcanist` when favorited)
  and `Remove Arcanist`, and clicking the favorite button invokes `onToggleFavorite` with the
  inverted `isFavorited` value

#### Scenario: Edit toggle round trip

- **WHEN** the edit toggle is clicked
- **THEN** `.game-card-body` gains `is-editing` and `.game-card-edit-body` drops
  `aria-hidden`; a second click (now titled `Done editing`) reverts both

#### Scenario: Image loading and fallback

- **WHEN** the header image is still loading
- **THEN** a spinner shows in the image wrapper; on load it disappears, and on error the image
  source falls back to a ui-avatars URL derived from `name`

### Requirement: StatChip renders the canonical stat-chip

The shared `StatChip` component SHALL render a single `<span class="stat-chip">` carrying its
`label`, accepting props `label` (string) and optional `style` (CSSProperties). Game cards SHALL
use `StatChip` for compact stat displays rather than re-implementing the `.stat-chip` markup.

#### Scenario: Compact stat displayed

- **WHEN** `StatChip` is rendered with `label="ATK 2400"`
- **THEN** the output is one `<span class="stat-chip">ATK 2400</span>`, optionally carrying the
  passed inline `style`

### Requirement: ProgressSection wraps the canonical progress-section primitives

The shared `ProgressSection` component SHALL render a `.progress-section` wrapper containing a
`.section-header` row (a label span plus, when `value` is provided, a `.section-value` span)
followed by its `children`. Props: `label` (string), optional `value` (string|number), optional
`className` (appended to the wrapper), and `children`. Game cards SHALL use `ProgressSection` for
stat sections rather than re-implementing the wrapper markup.

#### Scenario: Section with a value

- **WHEN** `ProgressSection` is rendered with `label="Level"`, `value={80}`, and children
- **THEN** it renders `.progress-section` → `.section-header` (label + `.section-value` 80) →
  children

#### Scenario: Section without a value

- **WHEN** `ProgressSection` is rendered with `label` and children but no `value`
- **THEN** the `.section-value` span is omitted and only the label and children render

### Requirement: Modal provides the canonical overlay shell

The shared `Modal` component SHALL render a `.modal-overlay` containing a `.modal-content`
(optionally extended by a `className`), with a `.modal-header` (title `<h2>` + `.close-btn`), the
`children`, and an optional `.modal-footer`. Clicking the overlay SHALL close the modal; mousedown
on the content SHALL NOT. Pressing Escape SHALL invoke `onEscPress` when provided, otherwise
`onClose`. Picker/editor modals SHALL build on `Modal` rather than re-implementing the overlay
shell.

#### Scenario: Escape closes the modal

- **WHEN** the user presses Escape with no `onEscPress` supplied
- **THEN** `onClose` is invoked

#### Scenario: Overlay click vs content click

- **WHEN** the user mouses down on the `.modal-overlay` outside the content
- **THEN** `onClose` fires; **WHEN** the mousedown is on `.modal-content`, it does not

### Requirement: GameSwitcher renders the game dropdown and hides on selection

The shared `GameSwitcher` component SHALL render a `.game-switcher` dropdown driven by
the shared `GAMES` registry (`src/lib/games.ts`), highlight the active game by path
prefix, close on outside click, and render `null` on the selection page
(`location.pathname === '/'`).

#### Scenario: Hidden on the selection page

- **WHEN** the current route is `/`
- **THEN** `GameSwitcher` renders nothing

#### Scenario: Active game highlighted

- **WHEN** the current path starts with a game's `path`
- **THEN** that game's dropdown item carries the `active` class and the trigger shows its icon

### Requirement: Navbar provides the top-nav shell

The shared `Navbar` component SHALL render a `.navbar` containing the `GameSwitcher` and brand link
on the left and an auth area on the right: when `userEmail` is set, the email plus a Sign Out
button (`onSignOut`); otherwise a Sign In button (`onSignIn`). Props: optional `userEmail`,
`onSignIn`, `onSignOut`.

#### Scenario: Signed-in vs signed-out auth area

- **WHEN** `userEmail` is provided
- **THEN** the nav shows the email and a Sign Out button; **WHEN** absent, it shows a single Sign
  In button

### Requirement: ConfirmCheckbox requires a confirming second click

The shared `ConfirmCheckbox` component SHALL render a `.confirm-checkbox` button that, on first
click, enters a `confirming` state (showing "Click to confirm" and auto-reverting after 3000 ms);
a second click while confirming SHALL invoke `onChange(!checked)`. Props: `checked` (boolean),
`onChange((val: boolean) => void)`, `label` (string).

#### Scenario: Two-step confirmation

- **WHEN** the button is clicked once
- **THEN** it shows `confirming` ("Click to confirm") and does not change; **WHEN** clicked again
  within 3000 ms, `onChange` fires with the toggled value

#### Scenario: Confirmation times out

- **WHEN** 3000 ms pass after the first click with no second click
- **THEN** the `confirming` state clears and the label reverts

### Requirement: PreferenceChain renders an ordered stat-priority chain

The shared `PreferenceChain` component SHALL render an ordered list of `.pref-item` rows
inside a `.pref-chain`, supporting two modes selected by prop:

**Stat-chain mode** (default — HSR relic / N2E cartridge / P5X revelation editors): each row is
a stat `<select>` plus, for non-tail items, an operator `<select>` (`>`, `>=`, `OR`), and
for the tail item a `.remove-pref-btn` — followed by an `.add-pref-btn`. Appending SHALL
set the previous tail's operator to `>`; removing the tail SHALL clear the new tail's
operator to `null`. Values are `StatPreference[]`. `options` is a
`readonly (string | { value, label })[]`: a bare string is an option whose value equals its
label; a `{ value, label }` pair is an option whose stored value (e.g. a stat id) differs from
its shown label. Rows SHALL display the `label` and persist the `value`. A `string[]` behaves
exactly as before, keeping existing HSR and N2E call sites unchanged.

**Ranked-list mode** (AE weapon preferences): rows stack full-width in a
`.pref-chain-ranked` container; each `.pref-ranked-item` row is a rank label, a single
`<select>` carrying the shared `.game-select` control styling (so it matches standalone
dropdowns elsewhere) with **no operator select**, a per-item `.remove-pref-btn`, and
up/down reorder controls; followed by an `.add-pref-btn`. There are no comparison
operators between items — the list is a pure ranking ordered by position. `options` is a
`readonly { value, label }[]` so the persisted value (e.g. a weapon `id`) differs from the
shown label; values are the bare ordered value strings. Appending adds the first
not-yet-selected option; reordering swaps adjacent items; removing drops the targeted item
with no operator fixup.

Common props: `onChange`, `namePrefix`. Mode-specific props (`values` shape, `options`
shape, and the mode/variant selector) are defined by the component's TypeScript surface.

#### Scenario: Appending a priority

- **WHEN** "+ Add Priority" is clicked on a non-empty stat-chain
- **THEN** the previous tail's operator becomes `>` and a new tail item is appended with operator
  `null`

#### Scenario: Removing the tail

- **WHEN** the tail item's remove button is clicked in stat-chain mode
- **THEN** the item is dropped and the new tail's operator is reset to `null`

#### Scenario: Stat-chain distinct value and label

- **WHEN** stat-chain `options` are provided as `{ value, label }[]`
- **THEN** each row's stat `<select>` displays the label while `onChange` persists the corresponding
  value, and a newly appended item uses the first option's value

#### Scenario: Stat-chain bare string options unchanged

- **WHEN** stat-chain `options` are a `readonly string[]`
- **THEN** each option's value equals its label and behaviour is identical to before this change

#### Scenario: Appending in ranked-list mode

- **WHEN** the add control is clicked in ranked-list mode
- **THEN** a new row is appended with the first option not already present, and no operator select is rendered on any row

#### Scenario: Removing any item in ranked-list mode

- **WHEN** any row's remove button is clicked in ranked-list mode
- **THEN** that item is dropped, the remaining items keep their relative order, and no operator fixup occurs

#### Scenario: Reordering in ranked-list mode

- **WHEN** a row's up or down control is clicked in ranked-list mode
- **THEN** the item swaps position with its neighbor and `onChange` emits the reordered value list

#### Scenario: Distinct value and label in ranked-list mode

- **WHEN** ranked-list options are provided as `{ value, label }[]`
- **THEN** each row's `<select>` displays the label while `onChange` emits the corresponding value

### Requirement: Behaviourally-specced components are referenced, not redeclared

The shared components whose contracts are owned by other capabilities SHALL NOT be redeclared
here: `AuthGate` (`shared-auth`), `SavingToast` / `ToastContainer` (`shared-save-behaviour`),
`RosterPageLayout` / `LoadErrorState` (`shared-roster`), and `GameBadge` (`shared-card-badges`).

#### Scenario: No duplicate component contract

- **WHEN** this capability is reviewed against `shared-auth`, `shared-save-behaviour`,
  `shared-roster`, and `shared-card-badges`
- **THEN** none of `AuthGate`, `SavingToast`, `ToastContainer`, `RosterPageLayout`,
  `LoadErrorState`, or `GameBadge` is given a requirement here

### Requirement: Select renders the canonical styled dropdown

The shared `Select` component SHALL render a single `<select>` carrying the canonical dropdown
styling (surface, border, focus, and chevron) defined once in `src/styles/controls.css`. It SHALL
accept `value` (string), `onChange((value: string) => void)`, `options` (a `readonly` array of
either `string` or `{ value, label }`), and `name`; and optional `placeholder` (rendered as a
leading empty-value option), `disabled`, `size` (`'sm' | 'md'`, default `'md'`), and `className`.
Build-preference editors, picker modals, and party editors SHALL use `Select` rather than
re-declaring per-host `select` styling. No call site SHALL re-declare the select surface/focus
rules (`.relic-editor-body select`, `.cartridge-editor-body select`, and `.form-group select`
surface rules are removed in favour of the `Select` canonical class).

#### Scenario: Options provided as strings

- **WHEN** `Select` is rendered with `options={['HP%', 'ATK%']}` and a `value`
- **THEN** it renders one `<option>` per string whose value equals its label, and the matching
  option is selected

#### Scenario: Options with distinct value and label

- **WHEN** `Select` is rendered with `options={[{ value: 'w1', label: 'Blade (5★)' }]}`
- **THEN** the option displays the label while `onChange` emits the `value`

#### Scenario: Placeholder option

- **WHEN** a `placeholder` is supplied and `value` is empty
- **THEN** a leading empty-value `<option>` showing the placeholder text is rendered and selected

### Requirement: FormGroup wraps a labeled control

The shared `FormGroup` component SHALL render a `.form-group` wrapper containing a `<label>` (text
from `label`, optional `htmlFor`) followed by its `children`. Call sites SHALL use `FormGroup`
rather than hand-writing the `.form-group` → `<label>` markup. `FormGroup` SHALL accept an optional
`className` that is appended to the `.form-group` wrapper, so a call site can attach a state
modifier (e.g. a gated/disabled `is-gated` hook) without hand-writing the markup.

#### Scenario: Labeled control

- **WHEN** `FormGroup` is rendered with `label="Main Stat"` and a `Select` child
- **THEN** it renders `.form-group` → `<label>Main Stat</label>` → the `Select`

#### Scenario: Optional modifier class

- **WHEN** `FormGroup` is rendered with `className="is-gated"`
- **THEN** the wrapper carries both `form-group` and `is-gated` classes; **WHEN** `className` is
  omitted, the wrapper carries only `form-group`

### Requirement: SubStatList renders a bounded repeatable stat list

The shared `SubStatList` component SHALL render an ordered list of removable stat rows plus an
add button, capped at `max` (default 4), using the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup defined once in `src/styles/controls.css`. Each row is
a stat `Select`; `values` are `string[]` (stat-type ids). Props: `values`, `options`, `onChange`,
`namePrefix`, optional `max`, `addLabel`, `label`, `disabled`, and `excludeValues` (a
`readonly string[]` of option **values** omitted from every row's option list except the row whose
own current value is already that value). There is no per-row value input — substats are tracked as
stat types only. When `disabled` is set, every row `Select` and every row remove button SHALL be
disabled and the add button SHALL be suppressed, so a host can gate the whole list behind a
precondition with no editing (add, change, or remove) possible.

`options` SHALL be a `readonly (string | { value, label })[]`: a bare string is an option whose
value equals its label; a `{ value, label }` pair is an option whose stored value differs from its
shown label. Rows SHALL display the option `label` and emit the option `value` (so a persisted stat
id can differ from the in-game label shown). The add button SHALL be hidden when
`values.length >= max`. `SubStatList` SHALL treat `values` as immutable — add, update, and remove
SHALL each emit a new `string[]`, never mutating the input. The HSR relic, P5X revelation, and N2E
cartridge editors SHALL use `SubStatList` rather than re-implementing the sub-stat row markup and
its duplicated CSS.

#### Scenario: Add button hidden at the cap

- **WHEN** `SubStatList` has `max={4}` and four values
- **THEN** no add button is rendered; **WHEN** a row is removed, the add button reappears

#### Scenario: Row change emits a new string array

- **WHEN** a row's `Select` changes
- **THEN** `onChange` emits a new `string[]` with only that index replaced, with the original input
  array not mutated

#### Scenario: excludeValues omits a conflicting option

- **WHEN** `excludeValues={['attack']}` is passed (e.g. the equipped main stat id)
- **THEN** no row offers the `attack` option as selectable, except a row whose own current value is
  already `attack`

#### Scenario: Distinct value and label options

- **WHEN** `options={[{ value: 'damage-mult', label: 'Damage Mult. +' }]}`
- **THEN** each row's `Select` displays `Damage Mult. +` while `onChange` emits `damage-mult`

#### Scenario: Disabled suppresses editing

- **WHEN** `SubStatList` is rendered with `disabled`
- **THEN** every row `Select` and every row remove button is disabled and no add button is rendered

### Requirement: LevelSlider renders the canonical range control

The shared `LevelSlider` component SHALL render a `.level-slider` range `<input>` bound to a numeric
`value` between `min` and `max`, with a fill gradient up to the current value and, when `showValue`
is set, a `.level-value` readout. The fill colour SHALL be computed internally from the shared
`progressGradient` util over `[min, max]` — not passed in — so every level slider shares the
cross-game investment gradient. Props: `value`, `min`, `max`, `onChange((n: number) => void)`,
`name`, optional `showValue`, and optional `disabled` (disables the range input, e.g. when gated
behind an unmet precondition such as no equipped item). The N2E cartridge editor SHALL use
`LevelSlider showValue` rather than the bespoke `.cartridge-level-slider`, which is removed,
conforming its previously-static fill to the shared gradient.

#### Scenario: Value-bound fill

- **WHEN** `LevelSlider` is rendered with `value`, `min`, and `max`
- **THEN** the track fills proportionally to `(value - min) / (max - min)` and dragging emits the new
  integer value via `onChange`

#### Scenario: Optional readout

- **WHEN** `showValue` is set
- **THEN** a `.level-value` element shows the current value; **WHEN** unset, no readout renders

#### Scenario: Disabled range input

- **WHEN** `LevelSlider` is rendered with `disabled`
- **THEN** the range `<input>` is disabled and does not emit `onChange` on interaction

### Requirement: SegmentedButtons renders a pill-button selection row

The shared `SegmentedButtons` component SHALL render a row of pill buttons over the canonical base
button class defined once in `src/styles/controls.css` (consolidating `.toggle-btn`, `.rarity-btn`,
`.tier-btn`, and `.phase-btn`). Props: `options` (`readonly { value, label, modifier? }[]`),
`value` (`string | null`), `onChange((value: string | null) => void)`, optional `allowDeselect`,
`coloring` (`'static' | 'investment'`, default `'static'`), `name`, `disabled`, `size`
(`'md' | 'compact'`), and `className` (applied to the button-row container so a host can keep its
game-specific row-wrapper class, e.g. `.euphoria-row`). Selection is **single-exact**: exactly one
option — the one whose `value` matches — is active; there is no threshold/cumulative mode. With
`allowDeselect`, clicking the active option clears the selection (`null`). With `coloring="static"`
(categorical rows — rarity, tier) each option's optional `modifier` SHALL be emitted as a class hook
so game stylesheets supply per-option colour (e.g. `rarity-s`, `tier-splus`) without the shared
component owning the palette. With `coloring="investment"` (level rows — phase, portrait, euphoria,
amplification, arc-tier) the component SHALL colour the single active button from the shared
`progressGradient` by its position in `options`, owning the colour itself with no per-call style hook
and no colouring of the unselected rungs. Numeric selections are passed as their string form. The
N2E cartridge rarity row, R1999 party tier row, AE operator phase row, the R1999 arcanist portrait /
euphoria / amplification rows, and the N2E character-card **arc-tier** row SHALL use
`SegmentedButtons`. The N2E character-card **awakening** row is explicitly out of scope: it is a
multi-independent-`boolean[]` toggle (each slot toggled on its own), which does not fit the
single-value selection model, so it remains its own inline control.

#### Scenario: Single-exact selection

- **WHEN** an option is clicked
- **THEN** only that option carries the `active` class and `onChange` emits its value

#### Scenario: Deselect the active option

- **WHEN** `allowDeselect` is set and the currently-active option is clicked
- **THEN** `onChange` emits `null` and no option is active

#### Scenario: Per-option colour modifier

- **WHEN** an option carries `modifier="s"`
- **THEN** the rendered button includes the `rarity-s`-style class hook so the game's compound colour
  rule can match, and the shared component declares no colour for it

#### Scenario: Investment colouring owned by the component

- **WHEN** `coloring="investment"` and an option is the active (selected) one
- **THEN** the component colours only that button from `progressGradient` by its position in
  `options`, with no colour value passed in by the host and no colour on the unselected rungs

### Requirement: BuildComments renders a labeled notes textarea

The shared `BuildComments` component SHALL render a labeled textarea for free-text build notes,
reusing the canonical `.form-group textarea` styling rather than the duplicated
`.build-comments-textarea` rule. Props: `value`, `onChange((value: string) => void)`, optional
`label` (default `"Build Comments"`) and `placeholder`. The HSR relic and N2E cartridge editors
SHALL use `BuildComments` for their notes field.

#### Scenario: Notes edited

- **WHEN** the textarea content changes
- **THEN** `onChange` emits the new string value

### Requirement: PreferenceChain treats input values as immutable

`PreferenceChain` SHALL NOT mutate its `values` prop. Append, update, remove, and (ranked-list)
reorder SHALL each produce a new array whose changed items are new objects, leaving the caller's
input array and its item objects unmodified.

#### Scenario: Appending does not mutate the previous tail

- **WHEN** `PreferenceChain` (stat-chain) appends a priority and sets the previous tail's operator
  to `>`
- **THEN** the operator change appears only on a cloned item in the emitted array; the item object
  in the original `values` array is unchanged

### Requirement: Build-preference editors compose the shared input primitives

The build-preference editors SHALL compose the shared input primitives (`Select`, `FormGroup`,
`SubStatList`, `LevelSlider`, `SegmentedButtons`, `BuildComments`) and `PreferenceChain` rather
than re-implementing form controls or their styling — covering HSR `RelicEditorModal`, N2E
`CartridgeEditorModal`, and AE `OperatorCard`. Specifically, the main-stat priority chain in the
HSR and N2E editors SHALL be rendered by `<PreferenceChain variant="stat-chain">`, and the inline
`addMainStatPref` / `updateMainStatPref` / `removeMainStatPref` implementations SHALL be removed.

#### Scenario: No inline main-stat chain remains

- **WHEN** the codebase is searched for `addMainStatPref`, `updateMainStatPref`, or
  `removeMainStatPref`
- **THEN** no such inline implementations remain in `RelicEditorModal` or `CartridgeEditorModal`;
  the main-stat chains render through `PreferenceChain`

#### Scenario: No per-editor control-style duplication remains

- **WHEN** `RelicEditorModal.css` and `CartridgeEditorModal.css` are reviewed
- **THEN** they contain no `select` / `input` surface rules, no `.substat-row` / `.add-substat-btn` /
  `.remove-substat` rules, and no bespoke level-slider rules — those resolve from the shared
  primitives in `controls.css`

### Requirement: Build-preference editor modal layout pattern

The system SHALL enforce a canonical layout pattern for all build-preference editor
modals (HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, P5X
`RevelationEditorModal`, and any future game equivalents). Each modal SHALL use the
shared `Modal` component with a `className` for the game-specific body selector,
render `.modal-tabs` with `.tab-btn` buttons for "Equip" and "Preferences" tabs
(class names and styling inherited from `Modal.css`), render a single
`*-editor-body` container (`relic-editor-body`, `revelation-editor-body`, etc.)
that is a flex column with `gap: var(--spacing-lg)`, `overflow-y: auto`,
`max-height: 50vh`, and `padding: var(--spacing-lg)`, and return each tab's content
as a React fragment (`<>…</>`) so its children land directly inside the body container.

The body's **direct children** SHALL provide uniform inter-field spacing solely via the body's
`gap` — no margin, padding, or border-bottom on the children. Each direct child SHALL be one of:
a `FormGroup` (a labeled control), a per-slot **grouping container** (a bordered slot card that
arranges that slot's own `FormGroup`s — used by multi-slot editors like P5X that render every slot
in one body), or a thin **state wrapper** around a single primitive (e.g. an `is-gated` `<div>`
around a `SubStatList`). Single-slot editors (HSR, N2E) render `FormGroup`s directly; multi-slot
editors group per slot. The per-game CSS file SHALL define ONLY the body layout rule, any per-slot
grouping-card rule, and their mobile overrides — all other styling (tabs, form-group label/control
layout, select surfaces, preference-chain rows, substat rows, the shared `.readonly-stat` and
`is-gated` treatments) SHALL be inherited from `Modal.css` and `controls.css`. A mobile breakpoint
(`max-width: 600px`) SHALL reduce gap and padding to `var(--spacing-md)` and raise max-height to
`60vh`.

#### Scenario: Body children provide inter-field spacing via gap

- **WHEN** a build-preference editor modal's body renders multiple direct children
- **THEN** spacing between them is provided solely by the body's `gap` — no margin, padding, or
  border-bottom rules on the children

#### Scenario: Single-slot editors render FormGroups directly

- **WHEN** a single-slot editor body (HSR relic, N2E cartridge) is inspected
- **THEN** its `FormGroup`s (`.form-group`) are direct children of the `*-editor-body` container,
  with no intermediate grouping element between the body and the form groups

#### Scenario: Multi-slot editors group per slot

- **WHEN** a multi-slot editor body (P5X revelations) is inspected
- **THEN** each slot is a grouping container (a bordered slot card) that is a direct child of the
  body and holds that slot's labeled `FormGroup`s, and the body's `gap` spaces the slot cards

#### Scenario: Per-game CSS is minimal

- **WHEN** a build-preference editor modal's CSS file is reviewed
- **THEN** it contains only the body layout rule (flex-direction, gap, overflow-y, max-height,
  padding), any per-slot grouping-card rule (for multi-slot editors), and their mobile overrides —
  all other styling (tabs, form-group, selects, preference-chain rows, substat rows, the shared
  `.readonly-stat` and `is-gated` treatments) resolves from `Modal.css` and `controls.css`

#### Scenario: Tabs inherit from Modal.css

- **WHEN** a build-preference editor modal renders its tab row
- **THEN** it uses `.modal-tabs` and `.tab-btn` class names without any per-game tab CSS overrides

### Requirement: Equipment editors share labeled, set-gated stat controls

Every Set/Main/Sub equipment editor SHALL present its Equip form consistently, per the three rules
below. This covers the HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, and P5X
`RevelationEditorModal` — editors that model an equipped item as a Set/item plus a Main Stat and a
Substats list. The rules are labeled controls, read-only fixed mains, and set-gated editable
controls:

- **Labeled controls**: every editable stat control SHALL be wrapped in a `FormGroup` with an
  explicit label (`Set` / `Relic Set` / `Cartridge`, `Main Stat`, `Substats`), so the main-stat
  control is never visually ambiguous with a substat control. `SubStatList` SHALL carry its section
  `label`.
- **Fixed mains are read-only, not gated**: a slot whose main stat is fixed (HSR head/hands, P5X
  Sun/Space) SHALL render that stat via the shared `.readonly-stat` class (in `controls.css`), never
  an inline style, and SHALL always show it regardless of whether an item is selected.
- **Set-gated editable controls**: the editable Main Stat control, the Substats list, and any
  editable level control SHALL be **dimmed (`is-gated`) and disabled** while no Set / Cartridge is
  selected, and enabled once one is; a fixed-main read-only display is exempt. Gating uses the
  primitives' `disabled` prop for interaction and an `is-gated` wrapper for the dim.

This standard SHALL apply only to Set/Main/Sub equipment editors and SHALL NOT apply to the AE
weapon editor (a single inline weapon `Select` + `LevelSlider` in the operator card, with no
set/main/substat model and no fixed main).

#### Scenario: Every editable equip control is labeled

- **WHEN** an HSR relic, N2E cartridge, or P5X revelation editor renders its Equip tab
- **THEN** the item Set/Cartridge control, the Main Stat control, and the Substats list each render
  under an explicit label

#### Scenario: Editable stat controls are set-gated

- **WHEN** the editor has no Set / Cartridge selected
- **THEN** the editable Main Stat control, the Substats list (and, for N2E, the Level control) are
  disabled and carry the `is-gated` dim
- **WHEN** a Set / Cartridge is then selected
- **THEN** those controls become enabled

#### Scenario: Fixed main renders read-only and is never gated

- **WHEN** an HSR head/hands or P5X Sun/Space slot renders with no item selected
- **THEN** its fixed main stat is shown via `.readonly-stat` (no inline style) and is not dimmed

#### Scenario: HSR fixed main uses the shared class, not an inline style

- **WHEN** `RelicEditorModal` renders the head or hands fixed main stat
- **THEN** it uses the shared `.readonly-stat` class and no inline `style` attribute or hardcoded
  `rgba(...)` color

### Requirement: Stat labels mirror in-game strings and decouple id from label

Player-facing stat labels rendered by build-preference and equipment editors SHALL be the
verbatim in-game strings for that game — mirroring the game's own abbreviation and spacing
conventions (e.g. P5X abbreviates Multiplier → `Mult.` and Accuracy → `Acc.`, and marks percent
variants with a trailing `%` and no space). Labels SHALL be single-sourced in the game's
`data/{game}/*.ts` catalog.

Where a stat label may be re-pinned to track in-game text, the persisted value SHALL be a stable
id decoupled from the label, supplied to the shared primitives (`Select`, `SubStatList`,
`PreferenceChain`) as `{ value, label }` options so that changing a label never invalidates a
stored row. A stored id with no matching label SHALL resolve to the raw id rather than rendering
blank.

#### Scenario: Editor shows the in-game label, stores the id

- **WHEN** a build-preference editor renders a stat option whose id is `damage-mult` and label is
  `Damage Mult. +`
- **THEN** the control displays `Damage Mult. +` and any saved row stores `damage-mult`

#### Scenario: Relabel does not break saved rows

- **WHEN** a stat's display label is re-pinned while its id is unchanged
- **THEN** rows saved before the relabel still resolve to the new label with no data migration

#### Scenario: Unknown id degrades gracefully

- **WHEN** a stored stat id has no entry in the game's label map
- **THEN** the id string itself is shown, not a blank option

### Requirement: Semantic stat-option ordering

Stat-selection options (equip main/sub selectors and preference chains) SHALL be presented in a
single game-agnostic **semantic order**, identical in logic across every game. The order is a fixed
sequence of four buckets:

1. **Offensive** — ATK, ATK%, CRIT Rate, CRIT DMG/Multiplier, DMG bonus/multiplier (damage
   multiplier, elemental DMG, universal DMG), Break (Break Effect / Break Intensity), Pierce /
   Penetration.
2. **Defensive** — HP, HP%, DEF, DEF%, Effect RES.
3. **Tempo** — Speed / SPD, action gauge (e.g. Cycle Intensity), resource recovery (SP Recovery,
   Energy Regeneration).
4. **Supporting** — Healing (HP Recovery, Outgoing Healing, Healing Bonus), debuff application
   (Effect Hit Rate, Ailment Accuracy).

Within a bucket, a flat stat SHALL precede its percent variant (ATK before ATK%), otherwise the
master order above applies. Resource recovery (SP/Energy) is Tempo; HP Recovery (healing) is
Supporting.

This ordering SHALL be **explicit in the catalog data** — each game's `MAIN_STATS` (per slot) and
`SUB_STATS` arrays are authored/generated in semantic order, and the shared input primitives
(`Select`, `SubStatList`, `PreferenceChain`) render options in array order with **no runtime sort**.
Auto-generated pools SHALL be emitted in this order by their update script via an explicit ordered
label list; a stat absent from that list SHALL sort to the end (surfacing it for placement) rather
than being silently classified.

#### Scenario: A game's substat pool is in semantic order

- **WHEN** a game's `SUB_STATS` pool is read
- **THEN** its stats appear grouped Offensive → Defensive → Tempo → Supporting, flat before percent
  within a bucket

#### Scenario: Primitives do not re-sort options

- **WHEN** a stat pool is passed to `Select` / `SubStatList` / `PreferenceChain`
- **THEN** options render in the given array order; the component applies no reordering

#### Scenario: An unlisted stat surfaces rather than hiding

- **WHEN** an auto-generated pool contains a stat not in the generator's ordered label list
- **THEN** that stat is appended at the end of the pool (not dropped or silently bucketed), so the
  pinning test fails and a human places it
