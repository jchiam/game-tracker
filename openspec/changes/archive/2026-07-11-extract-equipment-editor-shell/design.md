## Context

Architecture-review finding 5 (2026-07-11, Worth exploring), grilled 2026-07-11. The archived editor-UI change unified the interaction contract and the `.equip-slot-card` CSS but left three components each hand-rendering the modal/tab/footer scaffold. Grilling compared the three bodies in detail and fixed the scope.

## Goals / Non-Goals

**Goals:**

- One implementation of the editor-modal structure: `Modal` + two tabs + `activeTab` + body wrapper + Done footer + equip-only footer extra.
- One implementation of the anchor-scroll effect (`useScrollAnchor`).
- The `shared-equipment-editor` interaction contract becomes structural: composing the shell _is_ complying with the two-tab / Done-only-footer requirements.

**Non-Goals:**

- **No slot-body unification.** The "near-identical" slot cards diverge structurally: HSR has one `validateAndSave` merging over `emptyRelic` with fixed-main enforcement and main-vs-sub pruning; P5X has three handlers, a stored single fixed main (Sun) and a derived dual fixed main (Space), and `{value,label}` option vocab; N2E's equip tab is not a slot grid at all (staged two-step name+rarity picker with local state, `LevelSlider`, `SegmentedButtons`). A shared slot renderer's config would re-encode those bodies as closures — MOVE, not CONCENTRATE. Rejected at grilling.
- No CSS change; no change to tab semantics (inactive tab stays unmounted).

## Decisions

**Scaffold-only scope (user decision at grilling).** Shell props: `title`, `equipTabLabel`, `className`, `bodyClassName`, `equipContent`, `preferencesContent`, `equipFooterExtra?`, `onClose`. Preferences tab label is the constant "Build Preferences". Both tab bodies are passed as `ReactNode`; the shell renders only the active one, preserving current unmount behaviour.

**`equipFooterExtra` as a plain node, equip-tab-only.** N2E's Un-equip button is the only footer variance and is already required by spec to exist only in single-item editors. The shell renders the extra before Done only while the Equip tab is active — a render-prop taking `activeTab` would be wider than the one behaviour it enables.

**`useScrollAnchor` is a hook, not a shell concern.** The shell doesn't know about slots; the effect lives where the anchored element renders (per-game equip bodies). Two identical adapters (HSR, P5X) make it a real seam; N2E simply doesn't use it. Keeps the optional-chained `scrollIntoView` call (jsdom guard) in one place.

**Class names pass through.** `className` (modal) and `bodyClassName` keep the existing per-game CSS keys (`relic-editor`/`relic-editor-body`, …) so stylesheets and tests are untouched. _Alternative — canonicalize a `.equipment-editor-body` class:_ deferred; pure churn with no behaviour gain, can ride a later CSS pass.

**Named "Equipment Editor Shell" in CONTEXT.md (user decision at grilling).** Same discipline as Game Card Shell: a named structural seam every equipment game composes.

## Risks / Trade-offs

- **Markup must stay identical** (tab classes, footer order, body wrapper) so the three existing modal test suites pass unchanged — that is the verification.
- **Eagerly-created tab elements:** passing both bodies as `ReactNode` creates both element trees per render, but only the active one mounts/renders — same semantics, negligible cost.
