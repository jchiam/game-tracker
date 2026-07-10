## 1. HSR relic editor

- [x] 1.1 `RelicEditorModal.tsx`: replace the inline-styled fixed-main `(Fixed)` `<div>` (hardcoded `rgba`) with `<span className="readonly-stat">` (HP/ATK, `(Fixed)` suffix).
- [x] 1.2 `RelicEditorModal.tsx`: set-gate on `currentRelic.setId` — disable the variable-main `Select` and the `SubStatList`, and mark their groups `is-gated`, when no set is chosen; fixed head/hands readonly stays ungated.

## 2. N2E cartridge editor

- [x] 2.1 `CartridgeEditorModal.tsx`: set-gate on `currentCartridgeId` — disable the Main Stat `Select`, the `LevelSlider`, and the `SubStatList`, and mark their groups `is-gated`, when no cartridge is selected; the Cartridge name select and Rarity row keep their existing name-gate only.

## 3. Tests

- [x] 3.1 `RelicEditorModal.test.tsx`: assert fixed-main uses `.readonly-stat` (no inline style); assert variable slot gates main+substats until a set is chosen, and enables after.
- [x] 3.2 `CartridgeEditorModal.test.tsx`: assert Main Stat / Level / Substats are disabled + `is-gated` with no cartridge, and enabled once name+rarity form a cartridge.

## 4. Spec sync (already authored in delta; verify only)

- [x] 4.1 Confirm the shared-ui-components delta covers: FormGroup `className`, SubStatList `disabled`, the reconciled layout-pattern requirement (+ rewritten scenarios), and the ADDED labeled + set-gated standard.

## 5. Validate

- [x] 5.1 `npm run lint && npm run format:check` clean.
- [x] 5.2 `npm test` — HSR + N2E editor suites green.
- [x] 5.3 `npm run build` clean.
- [x] 5.4 `npx openspec validate standardise-equip-editor-form --strict`.
