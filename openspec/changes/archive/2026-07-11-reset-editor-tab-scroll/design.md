# Design — Reset Editor Tab Scroll

## Decision: shell owns the reset

The scroll container is the shell's body wrapper (`<div className={bodyClassName}>`), which stays mounted across tab switches while its children swap. Whoever owns that div owns its `scrollTop` — that's the shell. Per-game resets would re-duplicate the exact mechanics `EquipmentEditorShell` was extracted to concentrate.

Implementation shape:

```tsx
const bodyRef = useRef<HTMLDivElement>(null);
const isFirstTab = useRef(true);
useEffect(() => {
  if (isFirstTab.current) {
    isFirstTab.current = false;
    return;
  }
  bodyRef.current?.scrollTo?.({ top: 0 });
}, [activeTab]);
```

- `scrollTo` optional-chained for jsdom, same convention as `useScrollAnchor`.
- Skip-first-run guard preserves the anchor-slot scroll on initial modal open.

## Decision: anchor wins on open, top wins on return

On tab-return to Equip, EquipTab remounts and `useScrollAnchor` refires (child effect), then the shell's reset runs (parent effect — React flushes child effects before parent effects in the same commit). Both mutations land in the same task before the next paint, so the top position wins deterministically with no flicker. No change to `useScrollAnchor` or to any game modal is needed.

This scopes the anchor behaviour to initial modal open — which matches the desired contract: navigating **onto** a tab always lands at the top; the anchor is an open-time affordance, not a tab-time one.

## Rejected: per-game reset effects

Each game adding its own reset effect duplicates state the shell already owns (`activeTab` isn't even visible to games — they'd need a callback seam). Strictly worse locality.

## Rejected: keying the body div by tab

`<div key={activeTab}>` would remount the container and reset scroll for free, but it also discards the div node every switch and re-runs the anchor effect with no counterweight — returning to Equip would re-anchor, violating the contract.
