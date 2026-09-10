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
portrait / euphoria / amplification rows, the N2E character-card **arc-tier** row, the P5X
**Skills** milestone row, and the ZZZ **Skills** milestone row SHALL use `SegmentedButtons`. The
ZZZ **Core Skill** row SHALL use `SegmentedButtons` with `fill="cumulative"`. Rows of
independently-toggleable booleans — the N2E character-card **awakening** row — SHALL NOT use
`SegmentedButtons`, which models a single selected value; they belong to `ToggleChips`.

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
