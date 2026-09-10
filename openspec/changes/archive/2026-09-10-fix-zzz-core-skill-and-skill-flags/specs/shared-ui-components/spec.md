## ADDED Requirements

### Requirement: ToggleChips renders a multi-independent-boolean pill row

The system SHALL provide a shared `ToggleChips` component rendering a row of pill buttons over the
same canonical base button class as `SegmentedButtons`, for the case that component explicitly does
not model: a set of independently-toggleable booleans. Props: `options`
(`readonly { value, label, modifier? }[]`), `values` (`readonly string[]` — every currently-on
option), `onToggle((value: string) => void)`, and the same optional `name`, `disabled`, `size`
(`'md' | 'compact'`), and `className` props as `SegmentedButtons`. Any number of options MAY be on
simultaneously, including none and all. Toggling one option SHALL emit only that option's value and
SHALL NOT alter any other option's state. Each button SHALL carry `aria-pressed` reflecting whether
it is on. The component SHALL NOT own a colour palette beyond the canonical on/off treatment; a
per-option `modifier` SHALL be emitted as a class hook so a host stylesheet can supply an accent.

#### Scenario: Independent toggling

- **WHEN** two options are on and a third is clicked
- **THEN** `onToggle` emits only the third option's value, and the first two remain on

#### Scenario: Toggling an on option turns it off

- **WHEN** an option that is currently on is clicked
- **THEN** `onToggle` emits that option's value and the host may turn it off, leaving all other
  options unchanged

#### Scenario: Empty and full states are valid

- **WHEN** `values` is empty, or contains every option's value
- **THEN** the row renders with no pills on, or all pills on, respectively, and neither is treated as
  an error state

#### Scenario: Pressed state exposed to assistive technology

- **WHEN** the row renders
- **THEN** every button carries `aria-pressed` matching its on/off state

### Requirement: Cumulative rows preview the prerequisite range on hover and focus

Under `fill="cumulative"`, pointing at or keyboard-focusing a rung SHALL NOT highlight that rung in
isolation; it SHALL preview the entire range from the first rung, making the prerequisite chain
visible before the click commits. Given the selected rung `s` and the hovered-or-focused rung `h`:
when `h` is above `s`, the rungs above `s` up to and including `h` SHALL render in an **added**
preview state distinct from both attained and unattained, showing what would be gained; when `h` is
below `s`, the rungs above `h` up to and including `s` SHALL render in a **dropped** preview state,
showing what would be given up; when `h` is the selected rung and `allowDeselect` is set, the whole
attained run SHALL render in the dropped preview state, because the click clears it. Moving the
pointer off the row, or moving focus away, SHALL restore the resting state. Keyboard focus SHALL
produce the same preview as pointer hover, so the affordance is not pointer-only. The resting
cumulative ramp SHALL communicate the attained run on its own, so no information is lost on input
devices without hover.

#### Scenario: Upgrade preview

- **WHEN** rung 3 of 6 is selected and the pointer enters rung 5
- **THEN** rungs 1–3 stay attained, rungs 4–5 render in the added preview state, and rung 6 stays
  unattained

#### Scenario: Downgrade preview

- **WHEN** rung 5 of 6 is selected and the pointer enters rung 2
- **THEN** rungs 1–2 stay attained and rungs 3–5 render in the dropped preview state

#### Scenario: Hovering the selected rung previews clearing

- **WHEN** `allowDeselect` is set, rung 4 is selected, and the pointer enters rung 4
- **THEN** rungs 1–4 all render in the dropped preview state

#### Scenario: No isolated single-rung hover

- **WHEN** the pointer enters any rung of a cumulative row
- **THEN** no rung renders a highlight that is independent of the range from the first rung

#### Scenario: Leaving the row restores the resting state

- **WHEN** the pointer leaves the row or focus moves off it
- **THEN** every rung returns to its attained or unattained resting rendering

#### Scenario: Keyboard focus previews identically

- **WHEN** a rung receives keyboard focus
- **THEN** the same range preview renders as when that rung is hovered

## MODIFIED Requirements

### Requirement: SegmentedButtons renders a pill-button selection row

The shared `SegmentedButtons` component SHALL render a row of pill buttons over the canonical base
button class defined once in `src/styles/controls.css` (consolidating `.toggle-btn`, `.rarity-btn`,
`.tier-btn`, and `.phase-btn`). Props: `options` (`readonly { value, label, modifier? }[]`),
`value` (`string | null`), `onChange((value: string | null) => void)`, optional `allowDeselect`,
`coloring` (`'static' | 'investment'`, default `'static'`), `fill` (`'exact' | 'cumulative'`,
default `'exact'`), `name`, `disabled`, `size`
(`'md' | 'compact'`), and `className` (applied to the button-row container so a host can keep its
game-specific row-wrapper class, e.g. `.euphoria-row`). Selection is always **single-valued**:
exactly one option — the one whose `value` matches — is the selected option, and `onChange` emits
that option's value. With
`allowDeselect`, clicking the selected option clears the selection (`null`). With `coloring="static"`
(categorical rows — rarity, tier) each option's optional `modifier` SHALL be emitted as a class hook
so game stylesheets supply per-option colour (e.g. `rarity-s`, `tier-splus`) without the shared
component owning the palette. With `coloring="investment"` (level rows — phase, portrait, euphoria,
amplification, arc-tier) the component SHALL colour buttons from the shared
`progressGradient` by their position in `options`, owning the colour itself with no per-call style
hook.

`fill` selects how the selection is **rendered**, without changing what is selected. With
`fill="exact"` (the default, and the behaviour of every pre-existing call site) only the selected
option renders as active and the unselected rungs carry no colour. With `fill="cumulative"` — for
ladders where each rung is a prerequisite of the next — every option from the first through the
selected option SHALL render as attained, each taking its own position on the gradient so the row
reads as a continuous ramp rather than a single lit pill. Numeric selections are passed as their
string form. Every button SHALL carry `aria-pressed` reflecting whether it renders as attained, so
assistive technology reports the whole attained run in cumulative mode rather than a single
selection.

The N2E cartridge rarity row, R1999 party tier row, AE operator phase row, the R1999 arcanist
portrait / euphoria / amplification rows, and the N2E character-card **arc-tier** row SHALL use
`SegmentedButtons`. The ZZZ **Core Skill** row SHALL use `SegmentedButtons` with
`fill="cumulative"`. Rows of independently-toggleable booleans — the N2E character-card
**awakening** row and the ZZZ combat-skill maxed row — SHALL NOT use `SegmentedButtons`, which
models a single selected value; they belong to `ToggleChips`.

#### Scenario: Single-exact selection

- **WHEN** an option is clicked
- **THEN** `onChange` emits its value and it becomes the selected option

#### Scenario: Deselect the active option

- **WHEN** `allowDeselect` is set and the currently-selected option is clicked
- **THEN** `onChange` emits `null` and no option is selected

#### Scenario: Per-option colour modifier

- **WHEN** an option carries `modifier="s"`
- **THEN** the rendered button includes the `rarity-s`-style class hook so the game's compound colour
  rule can match, and the shared component declares no colour for it

#### Scenario: Investment colouring owned by the component

- **WHEN** `coloring="investment"` and an option is the selected one
- **THEN** the component colours that button from `progressGradient` by its position in
  `options`, with no colour value passed in by the host

#### Scenario: Exact fill leaves earlier rungs uncoloured

- **WHEN** `fill` is omitted or `"exact"` and the third of six options is selected
- **THEN** only the third option renders as active and the first two carry no colour

#### Scenario: Cumulative fill renders the attained run as a ramp

- **WHEN** `fill="cumulative"` with `coloring="investment"` and the third of six options is selected
- **THEN** options one through three all render as attained, each coloured by its own position on the
  gradient, and options four through six render unattained

#### Scenario: Pressed state reflects the attained run

- **WHEN** `fill="cumulative"` and the third of six options is selected
- **THEN** the first three buttons carry `aria-pressed="true"` and the remaining three carry
  `aria-pressed="false"`
