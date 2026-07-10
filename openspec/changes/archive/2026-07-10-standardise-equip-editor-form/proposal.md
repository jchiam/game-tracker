## Why

`p5x-revelation-equip-form` fixed the P5X equip modal — labeled controls, set-gated stat
inputs, a shared `.readonly-stat` class, and per-slot grouping cards — but shipped three of
those as P5X-local code without a cross-game contract. The HSR relic and N2E cartridge editors
still (a) never gate their Main Stat / Substats behind picking a Set/Cartridge, and (b) HSR
renders its fixed head/hands main stat with an inline `style={{}}` block using a hardcoded
`rgba(255,255,255,0.02)` — a design-token-rule violation. And the shared-UI spec now lags the
code: `FormGroup.className`, `SubStatList.disabled`, and `.readonly-stat` exist in the codebase
with no requirement, while the "Build-preference editor modal layout pattern" requirement still
forbids the very per-slot grouping wrappers P5X now ships. This change lifts the P5X refinements
into a cross-game standard and reconciles the spec with the code.

## What Changes

- **Set-gating everywhere**: the HSR relic and N2E cartridge editors gate their editable stat
  controls (Main Stat, Substats; N2E also Level) — dimmed + disabled until a Set / Cartridge is
  chosen — extending N2E's existing rarity-gating precedent. Fixed mains are never gated.
- **HSR fixed-main migration**: replace HSR's inline-styled `(Fixed)` main-stat `<div>` with the
  shared `.readonly-stat` class, deleting the hardcoded `rgba()` and inline style.
- **Spec catch-up** (shared-ui-components), reconciling the contract with already-shipped code:
  - MODIFY **FormGroup** — document the optional `className` prop.
  - MODIFY **SubStatList** — document the optional `disabled` prop.
  - MODIFY **LevelSlider** — add an optional `disabled` prop (needed to gate the N2E cartridge level).
  - MODIFY **Build-preference editor modal layout pattern** — permit per-slot grouping containers
    (and gating wrappers) as the body's direct children for multi-slot editors, so P5X's slot cards
    are a principled case rather than a contradiction.
  - ADD **Equipment editors share labeled, set-gated stat controls** — the behavioural standard
    (labeled Set/Main Stat/Substats, set-gated editable controls, shared `.readonly-stat` for fixed
    mains) covering HSR relic, N2E cartridge, and P5X revelation editors.
- **AE scoped out** (with reason): the AE weapon editor is a single inline weapon `Select` +
  `LevelSlider` in the operator card body — no set / main-stat / substat form, no fixed main, no
  modal — so the Set→Main→Sub labeling/gating standard has nothing to apply to.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `shared-ui-components`: MODIFY FormGroup (className), MODIFY SubStatList (disabled), MODIFY
  LevelSlider (add `disabled`), MODIFY the build-preference editor modal layout pattern (allow
  per-slot grouping / gating wrappers), and ADD the equipment-editor labeled + set-gated
  stat-control standard.

## Impact

- `src/pages/honkai-star-rail/components/RelicEditorModal.tsx` — set-gating; fixed-main → `.readonly-stat`.
- `src/pages/neverness-to-everness/components/CartridgeEditorModal.tsx` — set-gating on Main Stat / Level / Substats.
- `RelicEditorModal.test.tsx`, `CartridgeEditorModal.test.tsx` — gating + readonly assertions.
- No data model, hook, or persistence change; no new external deps.
