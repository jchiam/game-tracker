## Why

The ZZZ Core Skill row's cumulative rung preview stripped the investment-gradient hue whenever a click would drop rungs: hovering the selected rung (deselect preview) or a lower rung repainted the affected run in neutral gray, and — because the pointer rests on a rung right after clicking it — the run grayed out immediately after selecting. The baseline ramp colour should stay visible in every interaction state; hover and selection should only layer additional treatment on top. The implementation has been fixed; the specs still mandate the old neutral-gray behaviour and must be brought in line.

## What Changes

- Dropped-preview rungs keep their own inline investment-gradient hue; the "will be given up" reading comes from a structural treatment (dimmed opacity + dashed border) instead of a neutral repaint.
- Clicking a rung clears the hover/focus range preview, so the click's result renders in its committed state immediately — no deselect preview flashes on the rung the pointer is still resting on.
- `.rung-drop` in `src/styles/controls.css` no longer declares background/border/colour overrides; it owns only the structural drop treatment.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shared-card-controls`: the "Canonical cumulative-rung state treatments" requirement is replaced wholesale (REMOVED + ADDED as "Canonical cumulative-rung state treatments keep the ramp hue") because its dropped-preview clause and scenario invert — the treatment SHALL keep the rung's own gradient hue and distinguish itself structurally, rather than being neutral with no hue.
- `shared-ui-components`: the SegmentedButtons cumulative range-preview requirement gains a clause + scenario — a click SHALL clear the active range preview so the committed result renders immediately.

## Impact

- `src/components/SegmentedButtons.tsx` — drop rungs receive the attained inline gradient; click resets hover/focus preview state (already implemented).
- `src/styles/controls.css` — `.rung-drop` reduced to `border-style: dashed; opacity: 0.55` (already implemented).
- `src/components/SegmentedButtons.test.tsx`, `src/components/SegmentedButtons.stories.tsx` — updated alongside (already implemented).
- Only consumer of `fill="cumulative"` is the ZZZ Core Skill row; no other game surfaces affected.
