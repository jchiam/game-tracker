## 1. Shared primitives

- [x] 1.1 `controls.css`: add a shared `.readonly-stat` class (token surface/border/text, matching the current `.rev-fixed-main` look) for read-only stat display.
- [x] 1.2 `SubStatList.tsx`: add an optional `disabled?: boolean` prop — pass it to each row `Select` and suppress the add button when disabled (generic; reused by the follow-up standardisation change).

## 2. P5X equip form

- [x] 2.1 `RevelationEditorModal.tsx`: wrap each slot in a `.rev-slot-card` with a `.rev-slot-header` slot name; replace the slot-name `FormGroup`.
- [x] 2.2 `RevelationEditorModal.tsx`: label the controls — `FormGroup label="Set"` for the set select, `FormGroup label="Main Stat"` for both the variable-main `Select` and the fixed-main read-only display, and pass `label="Substats"` to `SubStatList`.
- [x] 2.3 `RevelationEditorModal.tsx`: switch fixed-main chips from `.rev-fixed-main` to `.readonly-stat`.
- [x] 2.4 `RevelationEditorModal.tsx`: set-gate the editable stat controls — when the slot has no `setId`, mark the Substats wrapper (all slots) and the Main Stat group (variable slots only) `.is-gated`, disable the main `Select`, and pass `disabled` to `SubStatList`; enable when a Set is chosen. Fixed-main displays (Sun/Space) are never gated.

## 3. Styling

- [x] 3.1 `RevelationEditorModal.css`: style `.rev-slot-card` (border, radius, padding) and `.rev-slot-header` (slot-name heading); tokens only.
- [x] 3.2 `RevelationEditorModal.css`: add the `.is-gated` dim state (lowered opacity); remove the now-unused `.rev-fixed-main` rules (moved to shared `.readonly-stat`).

## 4. Tests

- [x] 4.1 `RevelationEditorModal.test.tsx`: assert each slot renders `Set`, `Main Stat`, `Substats` labels; fixed-main (Sun/Space) shows `.readonly-stat` under `Main Stat`.
- [x] 4.2 `RevelationEditorModal.test.tsx`: assert set-gating — no-set slot has disabled main select + disabled `SubStatList` (`.is-gated`); after choosing a Set they enable.
- [x] 4.3 `RevelationEditorModal.test.tsx`: assert five bordered `.rev-slot-card`s in space-first order.

## 5. Validate

- [x] 5.1 `npm run lint && npm run format:check` clean.
- [x] 5.2 `npm test` — P5X + `SubStatList` suites green.
- [x] 5.3 `npm run build` clean.
- [x] 5.4 `npx openspec validate p5x-revelation-equip-form --strict`.
