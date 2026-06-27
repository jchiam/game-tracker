## Why

The design system is documented as spec only in fragments. After
`2026-06-27-converge-game-card-badges` added `shared-card-badges`, the specced surfaces are
`shared-card-controls`, `shared-card-collapse`, `shared-card-badges` (three L2 slices) and
`shared-progress-gradient` (a util). Everything else — the L1 token discipline, the L2
`.game-card-*` skeleton the card slices hang off, and the L3 shared component contracts — lives
only in code and CLAUDE.md prose. This bootstrap captures those surfaces as canonical OpenSpec
capabilities so future visual changes delta against requirements instead of prose.

## What Changes

- Create new spec `shared-card-base`: the canonical `.game-card-*` skeleton, the three header
  buttons (`.favorite-btn`, `.remove-btn`, `.edit-toggle-btn`), and the progress-section
  primitives — all defined once in `src/styles/card.css`.
- Create new spec `shared-design-tokens`: the token-first discipline — tokens are the single
  source of truth, `tokens.css` is generated never hand-edited, game colours namespaced under
  `color.{gameId}`, canonical token names, duration-vs-transition rule.
- Create new spec `shared-ui-components`: the class/prop contracts of the shared L3 components not
  already specced behaviourally — `StatChip`, `ProgressSection`, `Modal`, `GameSwitcher`,
  `Navbar`, `ConfirmCheckbox`, `PreferenceChain`.

No application code is changed. This is documentation only. These three capabilities are all-new
and do not restate the four existing card specs — collapse, controls, badges, and the progress
gradient remain the single source of truth for their own surfaces and are only cross-referenced.

## Capabilities

### New Capabilities

- `shared-card-base`: L2 card skeleton — `.game-card`, header/image/overlay/controls, body, name,
  the three header buttons, and the progress-section primitives, defined once in `card.css`.
- `shared-design-tokens`: L1 token discipline — token-first CSS, generated `tokens.css`,
  game-colour namespacing, canonical names, duration vs transition.
- `shared-ui-components`: L3 shared component contracts — visual/structural contracts for the
  shared components whose behaviour is not already captured elsewhere.

### Modified Capabilities

None — three all-new capabilities.

## Impact

- `src/styles/card.css` — source for `shared-card-base`.
- `src/styles/design-tokens.json`, `src/styles/tokens.css` — source for `shared-design-tokens`.
- `src/components/{StatChip,ProgressSection,Modal,GameSwitcher,Navbar,ConfirmCheckbox,PreferenceChain}.tsx`
  — source for `shared-ui-components`.
- Out of scope (already specced behaviourally, not duplicated): `AuthGate` → `shared-auth`;
  `SavingToast`/`ToastContainer` → `shared-save-behaviour`; `RosterPageLayout`/`LoadErrorState`
  → `shared-roster`; `GameBadge` → `shared-card-badges`. L4 game components are out of scope.
