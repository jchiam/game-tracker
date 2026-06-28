## Why

AE's (Arknights: Endfield) phase button row uses custom `.phase-btn` without `flex: 1` and `.phase-row` with `flex-wrap: wrap`, causing non-uniform button widths. R1999's portrait-row uses `.toggle-btn` with `flex: 1` and no wrapping, producing uniform stretching. Additionally, N2E's arc-tier-row placed an inline label inside the flex container, also preventing uniform button stretch.

## What Changes

- Add `flex: 1` and `text-align: center` to AE's `.phase-btn` so buttons divide row width equally
- Remove `flex-wrap: wrap` from `.phase-row` and standardise gap to `var(--spacing-3)` (matching R1999)
- Move N2E's inline "Tier" sublabel out of `.arc-tier-row` flex container to a preceding sibling
- Simplify N2E's `.arc-tier-row` CSS to match R1999's `.portrait-row` pattern

## Capabilities

### New Capabilities

### Modified Capabilities

- `ae-operator-detail`: Phase toggle button row must use `flex: 1` on buttons for uniform width, no flex-wrap

## Impact

- `src/pages/arknights-endfield/components/OperatorCard.css` — add `flex: 1` to `.phase-btn`, remove `flex-wrap` from `.phase-row`
- `src/pages/neverness-to-everness/components/CharacterCard.tsx` — move sublabel span outside `.arc-tier-row`
- `src/pages/neverness-to-everness/components/CharacterCard.css` — simplify `.arc-tier-row` to match pattern
