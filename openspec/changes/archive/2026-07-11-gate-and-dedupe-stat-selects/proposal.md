## Why

The build-preference and equipment editors let a user pick stat combinations the game
rules forbid: a substat equal to the slot's main stat, the same substat twice on one item,
or the same stat twice in a priority chain. The `SubStatList` and `PreferenceChain`
(stat-chain mode) primitives allow these; only the AE-only `PreferenceChain` ranked-list
mode dedupes today. N2E's cartridge editor is the worst case — it excludes nothing and
never prunes — but sibling-duplicate substats are selectable in every game. This produces
build definitions that can never be satisfied by real gear and skew the equipment scores.

## What Changes

- `SubStatList` gains **internal sibling dedupe**: a row's option list omits stats already
  chosen by _other_ rows (its own current value stays visible), the add button appends the
  first stat that is neither excluded nor already chosen, and the add button is suppressed
  when no allowable stat remains. This composes with the existing `excludeValues` (main
  stat) so the two exclusions stack.
- `PreferenceChain` **stat-chain mode** gains the same dedupe already present in ranked-list
  mode: each row's stat `<select>` omits stats chosen by other rows (own value kept),
  appending adds the first not-yet-chosen stat, and the add button disables when the option
  set is exhausted.
- The three Set/Main/Sub equipment editors (HSR relic, N2E cartridge, P5X revelation) gate
  the **Substats list behind the slot's main stat** on _variable-main_ slots — substats stay
  disabled/dimmed until a main is chosen — while fixed-main slots (HSR head/hands, P5X
  Sun/Space) stay set-gated only. This is the user-chosen resolution to the pick-substat-
  before-main flow: prevent the collision instead of silently pruning after it.
- The **substats-never-equal-the-main invariant** is applied uniformly: every editor passes
  the equipped main as `excludeValues`, and pruning a substat that equals a _newly chosen_
  main runs on main change. N2E is brought to HSR/P5X parity here (it currently does
  neither).

Scope is UI form-control hygiene only. No scoring, persistence, schema, or data-catalog
changes. Existing saved preferences that already contain a duplicate/collision remain valid
data — the guards prevent creating new ones and prune on the next main-stat edit; no
migration or bulk cleanup.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `shared-ui-components`: three requirements change —
  - **SubStatList renders a bounded repeatable stat list** — add internal sibling dedupe to
    the option/add semantics.
  - **PreferenceChain renders an ordered stat-priority chain** — stat-chain mode dedupes
    across rows (parity with ranked-list mode).
  - **Equipment editors share labeled, set-gated stat controls** — extend the gate rule to
    also gate variable-main substat lists behind main-stat selection, and codify the
    substats-exclude-and-never-duplicate-the-main invariant across all three editors.

## Impact

- **Components:** `src/components/SubStatList.tsx`, `src/components/PreferenceChain.tsx`.
- **Editors:** `src/pages/neverness-to-everness/components/CartridgeEditorModal.tsx` (add
  `excludeValues`, prune substats in the `cartridgeMainStat` handler, gate substats behind
  main), `src/pages/honkai-star-rail/components/RelicEditorModal.tsx` and
  `src/pages/persona-5-phantom-x/components/RevelationEditorModal.tsx` (gate variable-main
  substats behind main).
- **Tests:** unit tests for both primitives' dedupe behavior; editor tests for the
  main-gate and N2E prune/exclude.
- **No** change to services, hooks, scoring utils, `src/data/**`, DB, or CSP.
- **Storybook:** the repo currently has no `.storybook` config and zero `*.stories.*`
  files, so the "update Storybook" design-system mandate has no target for this change.
