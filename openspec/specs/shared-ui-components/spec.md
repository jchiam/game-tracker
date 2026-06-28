# shared-ui-components Specification

## Purpose

The L3 shared-component contracts — the class/prop surface of the reusable UI components whose
behaviour is not already owned by another capability: `StatChip`, `ProgressSection`, `Modal`,
`GameSwitcher`, `Navbar`, `ConfirmCheckbox`, and `PreferenceChain`. Components specced
behaviourally elsewhere are referenced, not redeclared: `AuthGate` (`shared-auth`), `SavingToast`
/ `ToastContainer` (`shared-save-behaviour`), `RosterPageLayout` / `LoadErrorState`
(`shared-roster`), and `GameBadge` (`shared-card-badges`).

## Requirements

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

The shared `GameSwitcher` component SHALL render a `.game-switcher` dropdown driven by a `GAMES`
array (each entry: `id`, `name`, `path`, `icon`, `color`), highlight the active game by path
prefix, close on outside click, and render `null` on the selection page (`location.pathname ===
'/'`).

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

**Stat-chain mode** (default, unchanged — HSR relic / N2E cartridge editors): each row is
a stat `<select>` plus, for non-tail items, an operator `<select>` (`>`, `>=`, `OR`), and
for the tail item a `.remove-pref-btn` — followed by an `.add-pref-btn`. Appending SHALL
set the previous tail's operator to `>`; removing the tail SHALL clear the new tail's
operator to `null`. Values are `StatPreference[]`; `options` is a `readonly string[]`
where the option value equals its label.

**Ranked-list mode** (new — AE weapon preferences): rows stack full-width in a
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
