# Reset Editor Tab Scroll

## Why

The equipment editor's scroll container (the shell's body wrapper) stays mounted across tab switches, so `scrollTop` persists. Scroll behaviour on tab navigation is inconsistent three ways across the games:

- **N2E** — never resets: switching tabs in either direction lands mid-scroll.
- **HSR / P5X → Build Preferences** — stale scroll carried over from the Equip tab.
- **HSR / P5X → back to Equip** — accidentally re-anchors: `useScrollAnchor` fires on every EquipTab remount, not just modal open, so returning to the Equip tab jumps back to the anchor slot instead of the top.

The `shared-equipment-editor` spec covers anchor-on-mount but is silent on tab-switch scroll — a genuine contract gap.

## What Changes

- `EquipmentEditorShell` owns scroll reset: on tab switch (not initial mount), the body wrapper scrolls to top. Structural — all three games get the behaviour with zero per-game code.
- Anchor-slot scroll is scoped to initial modal open only; returning to the Equip tab via tab switch lands at the top.
- `shared-equipment-editor` spec: MODIFY "Equipment Editor Shell composition" (shell owns tab-switch scroll reset) and "Unified all-slots editor modal" (anchor applies on initial open only).

## Capabilities

### Modified

- `shared-equipment-editor`: shell-owned scroll reset on tab switch; anchor scroll constrained to initial modal open.

## Impact

- `src/components/EquipmentEditorShell.tsx` — body wrapper ref + reset effect (skip initial mount).
- `src/components/EquipmentEditorShell.test.tsx` — new scroll-reset tests.
- No per-game modal changes; no CSS changes; no DB changes.
