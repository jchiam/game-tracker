## Context

See `proposal.md` — Why.

Constraints that shape the approach:

- `SegmentedButtons` has eight existing call sites across four games. Its current spec states
  selection is single-exact with "no threshold/cumulative mode", so any cumulative behaviour must be
  additive and default-off or those call sites change appearance.
- `getProgressStyle(value, min, max)` is the single source of truth for the rust→amber→gold→verdigris
  investment ramp. Its spec forbids consumers from defining their own copy, which extends to
  consumers mixing their own alphas off a returned `rgb()` string.
- `.toggle-btn:hover` in `src/styles/controls.css` is a global per-button treatment shared by every
  toggle row in the app. Project convention forbids neutralising an inherited rule with a
  property-reset override — "if you need them, the button is inheriting styles it shouldn't".
- ZZZ scalar agent fields (`level`, `mindscape`, `core_skill`) are flat columns with CHECK
  constraints, mapped through `agentService.ts`'s flat camel→snake `columnMap`. Plain field updates
  are declared as data via `makeFieldUpdater`.
- The Game Card Shell budgets measured collapsed heights, so the number of collapsed summary lines
  must stay fixed.

## Goals / Non-Goals

**Goals:**

- Correct the Core Skill letter mapping without touching stored data.
- Make "each rung is a prerequisite of the next" legible at rest and explicit on hover.
- Add the five skill-maxed flags with no new persistence machinery.
- Keep all four non-ZZZ games byte-identical in behaviour and appearance.

**Non-Goals:**

- Tracking numeric combat-skill levels, promotion tier, or Mindscape-derived skill bonuses.
- Folding Core Skill or the skill flags into `calculateZzzBuildScore`.
- Retrofitting cumulative fill onto other cumulative-in-reality ladders (Mindscape, Eidolon,
  Awareness). They render as a single number by convention and are out of scope.

## Decisions

### Letter correction is presentation-only; no migration

`CORE_SKILL_LETTERS` reverses from `['—','F','E','D','C','B','A']` to `['—','A','B','C','D','E','F']`.
The stored integer already means "rungs purchased" (0 = none, 6 = max), which is direction-agnostic —
only the label was wrong. So a stored `6` keeps meaning max and simply renders `F` instead of `A`.

**Alternative rejected:** migrating stored values (`7 - n`). That would be actively wrong: it assumes
users entered the letter they saw rather than the investment level they had. Since the gradient
already coloured 6 as most-invested, a user picking "max investment" stored 6 regardless of the label
bug. Rewriting the data would corrupt correct rows.

`CORE_SKILL_OPTIONS` keeps values `1..6` in ascending order; only `label` changes, so the row's
left-to-right order becomes A→F automatically and the investment gradient (index-based) already
ramps in the right direction.

### `fill` is a separate prop from `coloring`

Cumulative fill is a _rendering_ concern orthogonal to _which palette_ colours the row. Modelling it
as `fill: 'exact' | 'cumulative'` (default `'exact'`) rather than a third `coloring` value keeps the
two axes independent and leaves every existing call site untouched by omission.

**Alternative rejected:** `coloring="cumulative"`. It conflates palette with fill and would make a
future static-palette cumulative row inexpressible.

### Selection stays single-valued; only rendering is cumulative

`value` remains `string | null` and `onChange` still emits one value. Cumulative mode derives
`activeIdx = options.findIndex(o => o.value === value)` and renders `idx <= activeIdx` as attained.
Click and deselect semantics are unchanged — `allowDeselect` still keys off the exact clicked option.
This keeps the ZZZ hook contract (`updateCoreSkill(id, number)`) as it is.

### Hover/focus range preview lives inside the component

The component holds `hoverIdx` and `focusIdx` (both `number | null`), resolving `previewIdx =
hoverIdx ?? focusIdx`, and derives a per-button `rungState: 'attained' | 'add' | 'drop' | 'empty'`.
`onMouseLeave` on the row container clears `hoverIdx`; `onBlur` clears `focusIdx`.

Keeping this internal means hosts pass no hover state and cannot get the prerequisite semantics
wrong. Focus mirrors hover so the affordance is not pointer-only; the resting ramp carries the same
information for touch, where neither fires.

**Alternative rejected:** pure-CSS sibling selectors (`.toggle-btn:hover ~ .toggle-btn`). CSS can
express "everything after the hovered rung" but not "the range between the hovered rung and the
_selected_ rung", which is exactly the add-vs-drop distinction. It would also need the row reversed
in the DOM for one of the two directions.

### Preview colours come from the gradient utility

`progressGradient.ts` gains a preview variant returning the same interpolated hue at lower border and
active-background opacities. The `drop` state deliberately takes no gradient hue — it uses neutral
tokens, because the hue is what the click takes away. Encoding "weaker but same ramp" once keeps the
ramp's single-source-of-truth guarantee intact.

### Base hover is scoped at its declaration, not overridden

`.toggle-btn:hover` becomes `.toggle-btn:not(.is-rung):hover`, where cumulative rungs carry an
`.is-rung` class emitted by `SegmentedButtons` under `fill="cumulative"`. Cumulative rows then never
inherit a per-button hover, so no reset override is needed.

**Alternative rejected:** `.segmented-buttons:not(.is-cumulative) .toggle-btn:hover` — container-based
scoping. The task 1.2 inventory (below) found `.toggle-btn` rendered _outside_ any `.segmented-buttons`
container in three places, which container scoping would silently strip hover from. Scoping by a class
on the button itself matches only the buttons that actually opt into cumulative rendering.

**Alternative rejected:** `.is-cumulative .toggle-btn:hover { border-color: inherit; color: inherit }`.
That is precisely the opt-out shape the project forbids.

## Implementation Notes

### Task 1.2 — `.toggle-btn` render-site inventory

Every site that renders a `.toggle-btn`, and whether it sits inside a `.segmented-buttons` container:

| Site                                                                                                                                                                                                                  | Inside `.segmented-buttons`? |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `src/components/SegmentedButtons.tsx:68` — all eight game call sites (N2E cartridge rarity, R1999 party tier, AE operator phase, R1999 portrait / euphoria / amplification, N2E arc-tier, ZZZ Mindscape + Core Skill) | Yes                          |
| `src/pages/neverness-to-everness/components/CharacterCard.tsx:177` — N2E awakening row (`.awakening-row`), the multi-boolean row the shared spec excludes from `SegmentedButtons`                                     | **No**                       |
| `src/styles/ControlPatterns.stories.tsx:91–101` — toggle-row and compact-row pattern stories                                                                                                                          | **No**                       |
| `src/styles/components.md:337–340, 697–702, 735–737` — documentation markup                                                                                                                                           | **No** (docs only)           |

`.edit-toggle-btn` (card.css, `GameCardShell.tsx:205`) is a separate primitive, not a `.toggle-btn`
variant, and is unaffected. `.toggle-btn.portrait-reset:hover` (R1999) is a modifier hover layered on
the base and continues to apply, since `.portrait-reset` buttons never carry `.is-rung`.

### `ToggleChips` is a new component, not a `SegmentedButtons` mode

`SegmentedButtons` is specified around one selected value; five independent booleans are a different
contract (`values: readonly string[]`, `onToggle(value)`). Bolting a multi-select mode on would make
`value`/`values` mutually exclusive props on one component. The N2E awakening row is already called
out in the existing spec as not fitting the single-value model, so this component has a second
plausible consumer.

**Alternative rejected:** hand-rolling five buttons inside `AgentCard`. Project convention forbids
re-implementing shared control patterns with raw elements.

### Five flat boolean columns, not JSONB

Matches the existing ZZZ scalar convention and AE's `skills_maxed` precedent. Flat columns drop
straight into the flat `columnMap` + select list and get five `makeFieldUpdater` declarations with no
custom bodies. JSONB would force an Extras Adapter and hand-written mapping for data that has no
variable shape.

**Alternative rejected:** one `skill_maxed_mask` integer bitfield. Compact but opaque in the DB,
needs encode/decode on both sides, and blocks per-field CHECKs — no benefit at five fields.

### Card prop is one callback, not five

`onToggleSkillMaxed(id, key)` with a `ZzzSkillKey` union, dispatched inside the page to the five
updaters via a lookup map. Keeps `AgentCard`'s prop surface from growing five near-identical
callbacks.

## Risks / Trade-offs

- **Users who compensated for the inverted labels** — someone who understood the bug and stored 1 to
  mean "max, displayed as A" will now see `A` meaning first rung. → Unmigratable either way: the two
  interpretations are indistinguishable in stored data. The gradient always coloured 6 as
  most-invested, so the compensating reading required ignoring the colour; treat correct-by-gradient
  as the intended semantics and note the flip in the change summary.
- **Scoping `.toggle-btn:hover` could drop hover from an unrelated row** if some toggle row renders
  outside a `.segmented-buttons` container. → Enumerate every `.toggle-btn` call site before editing
  the rule, and assert the base hover still applies in a non-cumulative story/test.
- **`aria-pressed` added to all pill rows, not just cumulative ones** changes how existing rows are
  announced. → This is a fix, not a regression: those buttons currently expose no selected state at
  all. No visual change.
- **Hover preview adds per-button state to a shared component**, i.e. re-renders on pointer move
  across the row. → Bounded: state is one integer, rows are ≤7 buttons, and `exact` mode can skip the
  handlers entirely so existing call sites take no new work.
- **Skill flags are coarse** — "maxed or not" cannot express Lv. 9. → Deliberate per the user's
  scope; the finer model stays available later since adding levels alongside booleans is additive.

## Migration Plan

1. Ship the migration first (five `BOOLEAN NOT NULL DEFAULT false` columns). Purely additive, so the
   currently-deployed frontend keeps working against the new schema — it simply ignores the columns.
2. Ship the frontend. New rows get defaults; existing rows read `false` for all five.
3. **Rollback:** revert the frontend. The added columns are nullable-free with defaults and unread by
   the previous build, so they can be left in place; no down-migration is required to restore
   service.
4. The Core Skill letter flip needs no deploy coordination — it is a client-side label change with no
   schema or API surface.
