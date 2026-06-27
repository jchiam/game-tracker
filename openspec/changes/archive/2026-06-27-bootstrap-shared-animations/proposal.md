## Why

`src/styles/animations.css` is a named L2 design-system file (CLAUDE.md → "Shared Styles") holding
every shared `@keyframes`, yet it is the last L2 style file with no spec. After
`bootstrap-design-system`, the skeleton, controls, collapse, badges, and tokens are all specced;
animations are not. This bootstrap captures the keyframe single-source-of-truth contract so future
animation changes delta against a requirement instead of the file header comment.

## What Changes

- Create new spec `shared-animations`: the nine shared `@keyframes` (`fade-in-up`,
  `fade-in-down`, `fade-in`, `slide-in-down`, `slide-up`, `toast-slide-in`, `saving-toast-pulse`,
  `spinner-bounce`, `pulse-warn`) are defined exactly once in `animations.css`, which is globally
  imported so they resolve on any route; consumers reference them by name and never redefine them.

No application code is changed. This is documentation only. The animation-duration token rule
(`--duration-*`) stays owned by `shared-design-tokens` and is cross-referenced, not restated.

## Capabilities

### New Capabilities

- `shared-animations`: L2 shared keyframes — the canonical `@keyframes` set defined once in
  `animations.css`, globally imported and route-independent, referenced by name by all components
  and game styles.

### Modified Capabilities

None — one all-new capability.

## Impact

- `src/styles/animations.css` — source for `shared-animations`.
- `src/index.css` — imports `animations.css` globally (line 3); referenced by the route-
  independence requirement.
- Consumers referencing shared keyframes by name (`Modal.css`, `SavingToast.css`,
  `ToastContainer.css`, `GameSwitcher.css`, `ConfirmCheckbox.css`, `RosterPageLayout.css`,
  `SelectionPage.css`, `card.css`, `controls.css`, `index.css`) — referenced, not modified.
