## 1. Canonical compact toggle modifier

- [x] 1.1 In `src/styles/controls.css`, add `.toggle-btn.compact { padding: 5px 4px; font-size: 0.78rem; }` directly after the `.toggle-btn` rules.
- [x] 1.2 Update the Storybook `ControlPatterns` `ToggleButtons` story to include a `.toggle-btn.compact` example alongside the standard ones.

## 2. Migrate R1999 ArcanistCard

- [x] 2.1 In `ArcanistCard.tsx`, change portrait/euphoria button `className`s to `toggle-btn` (keep `portrait-reset` / `active` as additional classes) and amplify buttons to `toggle-btn compact`.
- [x] 2.2 Change the resonance and psychube slider `className`s from `resonance-slider` / `psychube-slider` to `level-slider`; keep the inline `--slider-fill-color` / `--slider-fill-glow` styles.
- [x] 2.3 Change the psychube select `className` from `psychube-select` to `game-select`.
- [x] 2.4 In `ArcanistCard.css`, delete the `.portrait-btn`, `.euphoria-btn`, `.amplify-btn`, `.resonance-slider`(+thumb), `.psychube-slider`(+thumb), and `.psychube-select` rules. Keep only `.portrait-reset` (scoped, no `.toggle-btn` re-declaration) and any genuinely game-unique rule.

## 3. Migrate N2E CharacterCard

- [x] 3.1 In `CharacterCard.tsx`, change awakening button `className`s to `toggle-btn` and arc-tier buttons to `toggle-btn compact`.
- [x] 3.2 Change every `character-slider` usage to `level-slider`; keep the inline fill custom properties.
- [x] 3.3 Change `character-select` usages to `game-select`.
- [x] 3.4 In `CharacterCard.css`, delete the `.awakening-btn`, `.arc-tier-btn`, `.character-slider`(+thumb), and `.character-select` rules.

## 4. Retire the shared `.character-slider` definition

- [x] 4.1 Confirm `ae-card-collapse-polish` has landed (AE no longer references `.character-slider`). If it has not, hold this change.
- [x] 4.2 Grep the whole repo for `character-slider`; confirm no remaining references after steps 3.2 and the AE change, then ensure no orphaned definition remains.

## 5. Tests + verify

- [x] 5.1 Update `CharacterCard.test.tsx`: replace the `.awakening-btn` query with `.toggle-btn` (or a stable semantic selector) and re-run.
- [x] 5.2 Grep tests for `portrait-btn` / `euphoria-btn` / `amplify-btn` / `resonance-slider` / `psychube-slider` / `psychube-select` / `character-select`; update any matches.
- [x] 5.3 Run `npm test` and confirm green.
- [x] 5.4 Run `npm run lint && npm run format:check && npm run build:storybook`.
- [x] 5.5 Visual parity verified by construction (canonical `.toggle-btn` / `.level-slider` / `.game-select` rules are byte-identical to the deleted standard rules; `.toggle-btn.compact` reproduces the exact `5px 4px` / `0.78rem`). Interactive `npm run dev` side-by-side diff still recommended before merge.
- [x] 5.6 Remove the "not yet migrated" / "tracked separately" caveats from `src/styles/components.md` (N2E and R1999 card sections).
