# Design — Standardize Build-Preference Components

## Context

Three editors edit "what a character has equipped" + "what the ideal build is": HSR relics,
N2E cartridges, AE weapons. Two are modals; AE is an inline card body. They share form controls
but each re-implements them. This change extracts the controls as host-agnostic L3 components so
the modal hosts and the card host compose the _same_ inputs.

```
            HSR RelicEditorModal     N2E CartridgeEditorModal     AE OperatorCard (card)
                     │                        │                          │
                     └────────────┬───────────┴────────────┬─────────────┘
                                  ▼                         ▼
                    L3 INPUT PRIMITIVES (host-agnostic, controls.css)
        Select · FormGroup · SubStatList · LevelSlider · SegmentedButtons · BuildComments
                                  │
                                  ▼
                    PreferenceChain (exists; widen adoption + immutability)
```

## Decisions

### D1 — One `Select`: a single visual language, `size` only varies density

The four select styles today are not just different sizes — they are two visual _languages_:
`.game-select` (card) has a chevron, `border-radius-sm`, and a plain border-color focus;
`.form-group select` (modal) has **no chevron**, `border-radius-md`, and a gold-glow focus. Picking
"one" therefore means a **deliberate visual change to modal selects**: they gain the chevron and the
single focus treatment. That is intended — visual consistency across hosts is the goal of this change
— but it is called out here so it is not mistaken for a no-op refactor.

Consolidate to a single `Select` with one canonical look (chevron always; one focus treatment). The
`size` prop varies only padding/font density, never the radius/chevron/focus language:

- `size="md"` (default) — modal density (≈`10px 14px`, base font).
- `size="sm"` — card density (the current `.game-select` compactness).

Props: `value: string`, `onChange: (value: string) => void`, `options: readonly (string | { value: string; label: string })[]`, `name: string`, `placeholder?: string` (rendered as a leading empty-value `<option>`), `disabled?`, `size?`, `className?`. The chevron colour becomes a token (D6).

The per-modal `.relic-editor-body select` / `.cartridge-editor-body select` rules and the
`.form-group select` surface rules are deleted; `Select` owns the look.

### D2 — `FormGroup` formalizes the existing `.form-group`

Thin wrapper: `<div class="form-group">` → `<label>` → `children`. Props: `label: string`,
`htmlFor?: string`, `children`. The `.form-group` CSS already exists in `Modal.css` and is global;
it stays where it is (or moves to `controls.css` during consolidation — implementer's call, no
behaviour change). `FormGroup` just stops every call site from hand-writing the wrapper markup.

### D3 — `SubStatList` covers both row shapes

HSR sub-stats are `{ type, value }` (a stat select **and** a free-text value input); N2E sub-stats
are bare `string` (stat select only). One component, two variants:

- `variant="stat-value"` — two-column row: stat `Select` + value `<input>`; values are `{ type, value }[]`.
- `variant="stat-only"` — one-column row: stat `Select` only; values are `string[]`.

Common props: `options`, `max` (default 4), `onChange`, `namePrefix`, `addLabel?`,
`excludeValues?: readonly string[]`, and `placeholder?: string` (the `stat-value` row's value
input, default `"Value"` — preserves the HSR `getByPlaceholderText('Value')` test handle, see D9). Renders the canonical `.substats-section` / `.substat-row` /
`.add-substat-btn` / `.remove-substat` markup, moved **once** into `controls.css` and deleted from
both editor stylesheets. The add button hides when `values.length >= max`. Like `PreferenceChain`,
`SubStatList` treats `values` as immutable (clones on add/update/remove) — the editors currently
mutate in place here too.

`excludeValues` covers the HSR cross-field rule: the equipped main stat must not be offered as a
sub-stat. HSR passes `excludeValues={[mainStat]}`; N2E passes nothing. Each row's option list omits
`excludeValues` (while still showing the row's own current value). The _pruning_ of an already-chosen
sub-stat when the main stat changes stays in the host's equip-validation (`validateAndSave`) — that
is save-time conflict resolution, not list-rendering behaviour, so it does not belong in `SubStatList`.

### D4 — `LevelSlider` consolidates the two sliders, gradient internalized

Range input bound to a numeric value with a fill gradient and optional readout. The fill colour is
**computed internally** from the shared `progressGradient` util over `[min, max]` — not passed in.
This conforms the N2E slider (currently static brand-primary) to the cross-game investment gradient
the AE slider already uses, and removes the per-call `fillColor`/`glowColor` escape hatch (deviation
analysis, Family A). Props: `value: number`, `min: number`, `max: number`,
`onChange: (n: number) => void`, `name: string`, `showValue?: boolean`. Renders the canonical
`.level-slider` (already used by AE) plus an optional `.level-value` span. `.cartridge-level-slider`
is deleted; AE stops computing a separate `levelPs` colour for the slider fill; N2E uses
`LevelSlider showValue`.

### D5 — `SegmentedButtons` consolidates **seven** pill rows

The pill row appears seven times under four class names. The full inventory (not the four first
spotted) drives the API:

| Row               | Game / host              | Selection                   | Active appearance                               |
| ----------------- | ------------------------ | --------------------------- | ----------------------------------------------- |
| rarity B/A/S      | N2E cartridge editor     | single-exact                | class modifier (`rarity-s`)                     |
| tier S+/S/A/B     | R1999 `PartyEditorModal` | single-exact **+ deselect** | class modifier (`tier-splus`)                   |
| phase P0–P5       | AE `OperatorCard`        | single-exact                | inline gradient                                 |
| portrait 0–5      | R1999 `ArcanistCard`     | single-exact                | **inline `btnPs.activeBg`** (progress-gradient) |
| euphoria 0–4      | R1999 `ArcanistCard`     | single-exact                | inline gradient                                 |
| amplification 1–5 | R1999 `ArcanistCard`     | single-exact, `.compact`    | inline gradient                                 |
| arc-tier 1–5      | N2E `CharacterCard`      | single-exact, `.compact`    | inline gradient                                 |

> **Not a `SegmentedButtons` row: N2E `CharacterCard` awakening.** It is a multi-independent
> `boolean[]` toggle (six slots, each flipped on its own), not a single-value selection, so it does
> **not** adopt `SegmentedButtons` and stays an inline control — an essential difference, like
> `excludeValues`/`allowDeselect`, not accidental drift.

**Selection is single-exact for every row — there is no `cumulative` mode.** All seven rows pick
exactly one value: a phase, portrait, euphoria, amplification, arc-tier, rarity, or tier _is_ a single
discrete state, not a "filled up to N" threshold. (An earlier draft modelled AE phase as cumulative
`>=`; that was wrong — a P3 operator is at phase 3, the same single-exact semantics as a level-3
portrait — so the cumulative mode was removed and AE phase standardised to single-exact like the
rest.) The one real axis left is **colour**:

- **Active colour is two mechanisms today — collapse to one rule, no per-call hook.** Rarity/tier
  colour the active button via a static class modifier (categorical). R1999's portrait/euphoria/
  amplification, AE phase, and N2E arc-tier represent **investment level** and SHALL be coloured by the
  shared `progressGradient` — but the gradient is **computed inside the component** from the active
  option's position over the row, not handed in via an `optionStyle` closure. This conforms the
  AE-phase outlier (static today → gradient) and replaces the inline `btnPs.activeBg` plumbing with a
  built-in. There is no `optionStyle` escape hatch.

One real prop — `coloring`:

- `coloring?: 'static' | 'investment'` (default `'static'`). `static` → active button takes the
  per-option `modifier` colour from game CSS (rarity, tier). `investment` → the component derives the
  single active button's colour from `progressGradient` by its position in `options`; no colour is
  passed in, and the unselected rungs are left bare (phase, portrait, euphoria, amplification,
  arc-tier).

Props: `options: readonly { value: string; label: string; modifier?: string }[]`,
`value: string | null`, `onChange: (value: string | null) => void`, `allowDeselect?` (a click on the
active option clears it to `null` — R1999 tier, an optional field),
`coloring?`, `name`, `disabled?`, `size?: 'md' | 'compact'`, `className?` (lands on the button-row
container so a host keeps its game-specific row-wrapper class — e.g. `.euphoria-row`, queried by
`within(euphoriaRow)…`; see D9). Renders the canonical base button class (consolidating onto the
existing `.toggle-btn` base). **Per-option `modifier` colours stay in game CSS** (categorical palette,
like `GameBadge` variants); **investment colour is owned by the shared component** via
`progressGradient`. Numeric values (phase, portrait, stage, amplification) are passed as their string
form; the host maps back on `onChange`.

`modifier` is a plain **class hook** and is emitted in **both** colourings, not just `static`: under
`static` the game CSS colours the active button by it; under `investment` it can still carry a
**non-colour** decoration (the component owns the colour, so a modifier never sets one). This is how
R1999's `portrait-reset` P0 styling survives on the investment portrait row.

This widens the change's adoption footprint to the R1999 and N2E **cards** (R1999 portrait/euphoria/
amplification + the N2E `CharacterCard` arc-tier row), not only the editors and party modals —
reflected in tasks §5. AE's phase row gains the investment gradient **and** switches from its old
cumulative fill (all rungs ≤N lit) to single-exact (only the current phase lit) — a deliberate,
visible change. The N2E awakening row is **not** adopted (see the inventory note above).

### D6 — Tokenize the hardcoded surfaces during consolidation

The duplicated rules hardcode `rgba()` values; the consolidated primitives must reference tokens.
Add to `design-tokens.json` (then `npm run build:tokens`) before referencing:

| New token (canonical name)     | Replaces                                                     |
| ------------------------------ | ------------------------------------------------------------ |
| `--color-input-surface`        | `rgba(255,255,255,0.05)` (input/select/textarea bg)          |
| `--color-input-surface-focus`  | `rgba(255,255,255,0.08)` (focus bg)                          |
| `--color-input-surface-subtle` | `rgba(255,255,255,0.03)` (segmented-button bg)               |
| `--color-focus-glow`           | `rgba(212,175,55,0.2)` (input focus glow)                    |
| `--shadow-slider-track-inset`  | `0 0 10px rgba(0,0,0,0.5) inset`                             |
| `--color-select-chevron`       | the `%23a0a0b5` stroke inside the `.game-select` chevron SVG |

The chevron lives in a `url("data:image/svg+xml…")`; the colour can't be tokenized inside the data
URI directly, so the implementer either swaps to a CSS `mask` (token-able) or accepts the chevron
colour as the one documented exception (mirroring the CLAUDE.md "rgba() badge background" known gap).
Decide at implementation; the table above is the target for everything that _can_ be tokenized.

### D7 — Adoption order

1. Extract the six primitives + widen `PreferenceChain`, with stories and tests.
2. Adopt in the three build-preference editors (`RelicEditorModal`, `CartridgeEditorModal`,
   `OperatorCard`). This is where the mutation-bug fix and the bulk of the CSS deletion land.
3. Adopt the shared controls in the remaining modals app-wide (`Add*` selects/search,
   `PartyEditorModal` tier via `SegmentedButtons`, form groups).
4. Delete the now-dead duplicated CSS rules; run `npm run lint && npm run format:check`, `npm test`.

### D8 — Normalize the equip-save callbacks to a single patch object

The save callbacks diverge for no domain reason (deviation analysis, Family B): HSR
`onSave(relicData)` takes one object; N2E `onSaveCartridge(id, rarity, level, mainStat, subStats)`
takes five positional args; AE `onUpdateWeapon(id, name, level)` takes three. A controlled primitive
emits `onChange(value)`, so wiring it to a positional callback forces every call to re-thread the
unchanged args. Rather than hide that behind a modal-local adapter, **conform the outliers to HSR's
object shape** and delete the divergence:

- N2E: `onSaveCartridge(id, rarity, level, mainStat, subStats)` → `onSaveCartridge(patch: Partial<CartridgeEquip>)`.
  `useCharacters.updateCartridge` accepts the patch and merges it onto the current row; `N2ePage`
  wiring and the modal/hook tests update to the object shape.
- AE: `onUpdateWeapon(id, name, level)` → `onUpdateWeapon(id, patch: Partial<{ weaponName, weaponLevel }>)`.
  `useOperators` merges the patch; AE page wiring and tests follow.
- HSR is already object-clean — unchanged, and becomes the reference shape.

Primitives then wire directly: `<Select onChange={(v) => onSaveCartridge({ mainStat: v || null })} />`.
Save semantics are unchanged — still debounced per-entity via `usePendingSaves`; only the callback
**shape** changes, and observable behaviour (which fields persist) is identical, so this is a refactor
with no spec-level behaviour delta (it lives in design + tasks, not the specs). This promotes
save-API normalization from a non-goal into scope; the blast radius is the two hooks
(`updateCartridge`, `updateWeapon`), the two page wirings, and their tests.

Two host behaviours stay in the host, not the primitives (controlled components, no conflict): N2E's
two-step name+rarity staging (`equipName`/`equipRarity`, persisted only once both are chosen — the
rarity row uses `SegmentedButtons disabled={!equipName}`), and save-on-every-change (one primitive
`onChange` = one save call, debounced downstream).

### D9 — Migration-preservation invariants (keep the ~327 existing queries green)

The build-preference editors, cards, and party modals carry ~327 test queries across 14 files. They
query in three styles, each pinning a handle the primitives MUST preserve, or the migration silently
breaks the suites:

| Query style               | Example                                                                                                   | Invariant the primitive must hold                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| by `name=` / tag          | `querySelector('select[name="cartridge-name"]')`                                                          | `Select` forwards `name` to its `<select>`; renders a real `<select>`                                    |
| by canonical class        | `.substat-row`, `.remove-substat`, `.add-substat-btn`, `.remove-pref-btn`, `.pref-chain`, `.level-slider` | primitives emit these exact class names (already canonical in the specs)                                 |
| by game row-wrapper class | `within(container.querySelector('.euphoria-row'))…`                                                       | `SegmentedButtons` accepts `className` for the host's row-wrapper class (D5)                             |
| by role + accessible name | `getByRole('button', { name: 'Build Preferences' })`                                                      | tab/footer button text unchanged (host-owned, not a primitive)                                           |
| by visible text + state   | `getByText('E2').toHaveClass('active')`                                                                   | `SegmentedButtons` renders the option `label` as the button's text and puts `active` on that same button |
| by placeholder            | `getByPlaceholderText('Value')`                                                                           | `SubStatList` `stat-value` value input keeps `placeholder` (default `"Value"`, D3)                       |
| positional control        | `fireEvent.change(selects[1], …)`                                                                         | `Select`/`SubStatList` preserve `<select>` source order                                                  |

**Consequence**: honored, the migration is mostly mechanical and the suites barely move; ignored, an
implementer who renames a class or drops a `name` detonates 14 test files. These invariants are a
hard acceptance constraint, gated by a grep in tasks §6, not a nice-to-have.

## Risks / Trade-offs

- **`SegmentedButtons` over-generalization.** The component carries one real variation axis,
  `coloring` (`static` categorical vs `investment` gradient), defaulting to the common `static` case.
  Selection is single-exact for every row — no `selectionMode`, no threshold/cumulative mode, no
  render-prop escape hatches.
- **Deliberate visible change: AE phase pills.** AE phase moves from its old cumulative fill (all rungs
  ≤N lit, static brand-primary) to single-exact + `coloring="investment"` (only the current phase lit,
  rust→teal gradient) — matching every other investment pill row (R1999 portrait/euphoria/amplification,
  N2E arc-tier) and AE's own sliders. Captured by a Storybook story and an updated `OperatorCard` test;
  called out so it is not read as a regression.
- **Save-normalization churn.** Conforming N2E/AE callbacks to a patch object (D8) touches
  `updateCartridge` / `updateWeapon`, two page wirings, and their tests. Mitigation: observable save
  behaviour is unchanged (debounced per-entity); the hook tests assert the merged-patch result, and
  the change is mechanical.
- **Visual regression during CSS deletion.** Removing per-modal select/sub-stat rules could shift
  spacing if `Select`/`SubStatList` don't match pixel-for-pixel. Mitigation: the primitives adopt the
  existing canonical values; Storybook stories make the before/after visually checkable, and the
  editors' existing component tests guard structure.
- **Token churn.** New tokens touch `tokens.css` (generated) and the `DesignTokens.stories.tsx`.
  Mitigation: token additions are additive; no existing token renamed.

## Open Question (defer, not blocking) — settled as defer

Promote the tabbed Equip/Preferences shell (`modal-tabs` + footer) to a shared `TabbedEditorModal`?
**Defer.** Evidence: `modal-tabs` / `activeTab` exist in exactly two files (`RelicEditorModal`,
`CartridgeEditorModal`) — AE `OperatorCard` does not tab (inline stacked sections), and R1999 has no
build-preference editor at all (its only modal is `PartyEditorModal`). Two consumers is the lowest
reuse bar in this change; promoting now would couple it to a second, orthogonal "slotted tabs+footer"
abstraction. Revisit once the primitives land and the shell is the only remaining duplication between
the two modals.

## Scope completeness

There are exactly **three** build-preference editors — HSR relics, N2E cartridges, AE weapons. R1999
participates only through shared primitives in non-editor surfaces (party-tier `SegmentedButtons`, and
the arcanist-card portrait/euphoria/amplification pill rows). No fourth editor exists.
