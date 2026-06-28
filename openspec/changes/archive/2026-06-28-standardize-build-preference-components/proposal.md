## Why

The three build-preference editors — HSR `RelicEditorModal`, N2E `CartridgeEditorModal`, and
AE `OperatorCard` (inline, not a modal) — assemble the same handful of form controls, but each
re-implements them. The duplication is concrete:

- **Select** is styled four different ways: `.game-select` (`controls.css`, with a chevron),
  `.form-group select` (`Modal.css`), and per-modal copies `.relic-editor-body select` and
  `.cartridge-editor-body select` — three of which re-declare the same surface/focus rules with
  hardcoded `rgba()` colours (a token-first violation).
- **The main-stat priority chain** is reimplemented inline in both editors
  (`addMainStatPref` / `updateMainStatPref` / `removeMainStatPref`) even though `PreferenceChain`'s
  stat-chain mode already exists and is imported in the same files for sub-stats. The inline copies
  carry a **latent mutation bug**: they shallow-copy preferences and then assign
  `arr[last].operator = '>'` / `newPrefs.mainStats[slot][idx] = …`, mutating the live React state
  objects in place. `PreferenceChain.StatChain` clones per item and returns a fresh array, so
  adopting it deletes the bug.
- **The repeatable sub-stat list** (`.substats-section` + `.substat-row` + `.add-substat-btn` +
  `.remove-substat`) is duplicated byte-for-byte between the two editor stylesheets.
- **The level slider** exists twice: shared `.level-slider` (used by AE) and a divergent
  `.cartridge-level-slider` (N2E only).
- **The segmented pill-button row** appears four times under four names with one shared shape:
  `.toggle-btn` (`controls.css`), `.rarity-btn` (N2E), `.tier-btn` (R1999 `PartyEditorModal`),
  and `.phase-btn` (AE).
- **The build-comments textarea** (`.build-comments-textarea`) re-declares what `.form-group
textarea` already provides.

This violates the CLAUDE.md L2/L3 rules (shared styles and shared components are canonical and must
not be re-declared per game) and makes the editors drift apart over time.

## What Changes

- Promote a small set of **host-agnostic L3 input primitives** so the same control renders
  identically inside a modal (HSR/N2E) or inside a card (AE): `Select`, `FormGroup`, `SubStatList`,
  `LevelSlider`, `SegmentedButtons`, `BuildComments`. Their canonical CSS lives once in
  `src/styles/controls.css` (the existing home of `.level-slider`, `.game-select`, `.toggle-btn`).
- **Widen `PreferenceChain` adoption**: replace both inline main-stat chains with
  `<PreferenceChain variant="stat-chain" options={…}>`, deleting the duplicated mutation-prone
  logic. Add an explicit immutability requirement to the `PreferenceChain` contract.
- **Adopt the primitives** in the three build-preference editors first, then across the remaining
  modals app-wide (`Add*` search/list modals and the three `PartyEditorModal`s) for the controls
  they share (`Select`, `FormGroup`, `SegmentedButtons` for tier).
- **Tokenize on consolidation**: the hardcoded `rgba()` input surfaces, focus glow, segmented-button
  surface, slider inset shadow, and `.game-select` chevron colour become design tokens in
  `design-tokens.json` (added before reference, per the token-first rule).
- **Conform the accidental cross-game deviations** rather than enshrine them behind escape-hatch props
  (see the deviation analysis in `design.md`):
  - **Investment colouring (Family A)** — internalize the shared `progressGradient` so all level/
    investment controls colour by value: `LevelSlider` computes its fill internally (conforms the
    static N2E slider), and `SegmentedButtons coloring="investment"` colours level pills internally
    (conforms the static AE phase row). Removes the `optionStyle` / `fillColor` per-call hatches.
  - **Save-callback shape (Family B)** — normalize N2E's 5-positional `onSaveCartridge` and AE's
    3-positional `onUpdateWeapon` to a single patch object matching HSR's `onSave`. Deletes the shape
    divergence (and the modal-local adapter it would otherwise need).
- **Storybook**: each new primitive gets a `.stories.tsx` with all variants; the existing
  `PreferenceChain.stories.tsx` and `ControlPatterns` story are extended.

## Capabilities

### Modified Capabilities

- `shared-ui-components`: Adds the `Select`, `FormGroup`, `SubStatList`, `LevelSlider`,
  `SegmentedButtons`, and `BuildComments` input-primitive contracts; adds an editor-composition
  requirement (the three build-preference editors compose these primitives and `PreferenceChain`
  rather than re-implementing form controls); adds a `PreferenceChain` immutability requirement.

## Impact

- **New code**: `src/components/Select.tsx`, `FormGroup.tsx`, `SubStatList.tsx`, `LevelSlider.tsx`,
  `SegmentedButtons.tsx`, `BuildComments.tsx` (+ tests + stories).
- **Modified components**: `RelicEditorModal`, `CartridgeEditorModal`, `OperatorCard`,
  `ArcanistCard` + N2E `CharacterCard` (pill-row adoption), the three `PartyEditorModal`s, and the
  `Add*` modals (control adoption only).
- **Modified hooks (Family B normalization)**: `useCharacters.updateCartridge` (N2E) and
  `useOperators.updateWeapon` (AE) take a patch object; their pages and tests follow.
- **Modified styles**: `controls.css` (gains the consolidated input rules); `Modal.css`,
  `RelicEditorModal.css`, `CartridgeEditorModal.css`, `PartyEditorModal.css`, and the R1999/N2E card
  CSS (lose the duplicated control + pill rules); `design-tokens.json` → `tokens.css` (new
  surface/focus/chevron tokens).
- **Bug fixed**: the live-state mutation in both inline main-stat chains, via `PreferenceChain`.
- **Deliberate visible changes** (each enumerated, none silent):
  - AE phase pills move from cumulative fill (all rungs ≤N lit, static) to single-exact + investment
    gradient (only the current phase lit) — matching every other investment pill row.
  - N2E cartridge level slider recolours to the investment gradient (Family A).
  - R1999 (portrait/euphoria/amplification) + N2E arc-tier pill rows drop the faded "passed" trail on
    rungs below the current selection — `SegmentedButtons` colours only the active rung (user-confirmed).
  - HSR "+ Add Substat" now appends a row with an **empty** value (was a hardcoded `2.5%`), so a new
    sub-stat starts blank for the user to fill — `SubStatList` owns the add and seeds no magic value.
  - R1999 + N2E **party-tier** buttons take the shared `.toggle-btn` / `.segmented-buttons` metrics
    (padding `spacing-3`, radius-sm, gap-3) in place of the old bespoke `.tier-btn` metrics
    (padding `spacing-sm/0`, radius-md, gap-sm) — a minor shape shift; per-tier colours unchanged.
- **No DB, schema, or data-pipeline changes** (callback-shape refactor only; persisted data unchanged).

## Non-Goals

- **Tracking N2E sub-stat magnitudes (#7).** HSR sub-stats carry a rolled value; N2E sub-stats
  currently model none. `SubStatList` keeps both `stat-value` and `stat-only` variants. Whether N2E
  _should_ track sub-stat values is a possible feature gap flagged for a **separate** follow-up
  proposal — not part of this standardization.
- **A unified preference modal.** AE deliberately edits inline in `game-card-edit-body`
  (just shipped). The shared layer is the inputs, not the host; AE stays card-based.
- **Forcing the `GameBadge` component into the `Add*` modals.** The `shared-card-badges` spec
  already sanctions hand-rendered badge spans there as long as they carry the `game-badge` base
  class — that decision stands; this change does not touch it.
- **Promoting the tabbed Equip/Preferences shell to a shared component.** Shared by only HSR + N2E;
  deferred as a possible follow-up, not part of this change.
