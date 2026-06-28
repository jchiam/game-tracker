# Tasks — Standardize Build-Preference Components

## 1. Tokens (do first — token-first rule)

- [x] 1.1 Add the new tokens to `src/styles/design-tokens.json`: `--color-input-surface`,
      `--color-input-surface-focus`, `--color-input-surface-subtle`, `--color-focus-glow`,
      `--shadow-slider-track-inset` (see design D6). Chevron colour kept as the one documented rgba()
      exception (data-URI can't hold a CSS var), mirroring the CLAUDE.md badge-background gap — no
      `--color-select-chevron` token.
- [x] 1.2 Run `npm run build:tokens`; confirm `tokens.css` regenerated (do not hand-edit it).
- [x] 1.3 Update `DesignTokens.stories.tsx` with the new tokens.

## 2. Extract input primitives (L3)

- [x] 2.1 `Select.tsx` (+ `.test.tsx`, `.stories.tsx`) — canonical chevron dropdown, `size` variant,
      string and `{value,label}` options, placeholder. Move/own the select rules in `controls.css`.
- [x] 2.2 `FormGroup.tsx` (+ tests, story) — `.form-group` wrapper.
- [x] 2.3 `SubStatList.tsx` (+ tests, story) — `stat-only` and `stat-value` variants, `max` cap,
      `excludeValues` row-option filter, immutable update. Move `.substats-section` / `.substat-row` /
      `.add-substat-btn` / `.remove-substat` into `controls.css` once.
- [x] 2.4 `LevelSlider.tsx` (+ tests, story) — `.level-slider` + optional `.level-value` readout.
      Fill colour computed **internally** from `progressGradient` over `[min, max]` (no `fillColor` prop).
- [x] 2.5 `SegmentedButtons.tsx` (+ tests, story) — single-exact selection (no `selectionMode` /
      cumulative mode), `allowDeselect`, `coloring` (`'static'` modifier-class / `'investment'` internal
      `progressGradient`), `className`, `size`. Consolidate onto the `.toggle-btn` base in `controls.css`.
      No `optionStyle` hook.
- [x] 2.6 `BuildComments.tsx` (+ tests, story) — labeled textarea reusing `.form-group textarea`.

## 3. Widen PreferenceChain

- [x] 3.1 Add the immutability guarantee to `StatChain` (clone the tail before setting its operator
      on add/remove) if not already fully clone-safe; extend `PreferenceChain.test.tsx` to assert the
      input `values` array and its items are not mutated. (StatChain already cloned — added the assertion.)
- [x] 3.2 Extend `PreferenceChain.stories.tsx` with the stat-chain immutability / main-stat usage.

## 4. Normalize equip-save callbacks (Family B), then adopt in the three editors

- [x] 4.0 Normalize save callbacks to a patch object (design D8): N2E `onSaveCartridge(patch)` +
      `useCharacters.updateCartridge(id, patch)` merging onto the current row; AE `onUpdateWeapon(id, patch)`
  - `useOperators` merge. Update `N2ePage` / AE page wiring and the hook + page tests. HSR already
    object-clean — reference shape, unchanged. (Added `N2ECartridgePatch` / `AeWeaponPatch` types.)
- [x] 4.1 `RelicEditorModal.tsx` — replace selects with `Select`, sub-stats with `SubStatList`
      (`stat-value`), the inline main-stat chain with `<PreferenceChain variant="stat-chain">`, notes
      with `BuildComments`; delete `addMainStatPref` / `updateMainStatPref` / `removeMainStatPref`.
- [x] 4.2 `CartridgeEditorModal.tsx` — same, plus `LevelSlider showValue` for level and
      `SegmentedButtons` (`single`, `coloring="static"`) for rarity; delete its inline main-stat chain.
      Wire primitives to the normalized `onSaveCartridge({ … })` patch callback.
- [x] 4.3 `OperatorCard.tsx` — adopt `Select` for the weapon picker, `LevelSlider` for the two
      sliders, `SegmentedButtons` (single-exact, `coloring="investment"`) for the phase row — this
      **switches phase from cumulative fill to single-exact and recolours to the investment gradient**
      (deliberate, design D5/Family A). (Already uses `PreferenceChain` ranked-list — unchanged.)
- [x] 4.4 Delete the now-dead rules from `RelicEditorModal.css` and `CartridgeEditorModal.css`
      (select/input surfaces, sub-stat rows, `.cartridge-level-slider`, `.rarity-btn`,
      `.build-comments-textarea`); keep only genuinely game-unique rules.
- [x] 4.5 Update the editors' component tests for the new structure.

## 5. Adopt app-wide (remaining modals)

- [x] 5.1 `AddCharacterModal` (HSR), `AddCharacterModal` (N2E), `AddArcanistModal`,
      `AddOperatorModal` — no-op: these are search-input + badge-filter pickers with no `<select>` or
      `.form-group` labeled-control markup to adopt. Search lives in the shared `.modal-search`; badges
      stay hand-rolled per `shared-card-badges`. Nothing to change.
- [x] 5.2 The two tier-bearing `PartyEditorModal`s (R1999, N2E) — `SegmentedButtons`
      (`single` + `allowDeselect`, static `tier-*` modifier) for the tier row; deleted `.tier-btn`
      base/hover (now `.toggle-btn`), retargeted the per-tier colours to `.toggle-btn`. (HSR party modal
      has no tier row.)
- [x] 5.3 R1999 `ArcanistCard` (portrait / euphoria / amplification) + N2E `CharacterCard` arc-tier
      row — single-exact investment pill rows. Adopt `SegmentedButtons` (`coloring="investment"`).
      **N2E awakening row is NOT in scope** — it is a multi-independent-`boolean[]` toggle, an essential
      difference that does not fit single-exact selection (stays as-is). **Gated decision:** these
      rows render a faded "passed" trail (opacity 0.35 colour on rungs below the current) that
      `SegmentedButtons` investment mode does not reproduce. **User chose: drop the trail, adopt shared**
      — lower rungs render plain; documented as a deliberate visible change. Adopted on R1999
      portrait/euphoria/amplification (+ LevelSlider/Select for the sliders/psychube) and N2E arc-tier;
      awakening stays an inline multi-toggle. `SegmentedButtons` now emits the `modifier` class in both
      colourings so `portrait-reset` survives under `investment`.
- [x] 5.4 Removed the now-dead `.form-group select` surface rules (Select owns the look; they were
      clobbering the chevron) and the orphaned `.build-comments-textarea` from `Modal.css`; retargeted
      `.tier-*` colours off `.tier-btn` onto `.toggle-btn` in `PartyEditorModal.css`; tokenized the
      remaining `.form-group` input/textarea surfaces.

## 6. Verify

- [x] 6.1 `npm run lint && npm run format:check`. (Clean.)
- [x] 6.2 `npm test` (unit) green — 962 passed; `npm run test:e2e` (Playwright) green — 57 passed.
- [x] 6.3 `npm run build` (tsc + vite) clean.
- [ ] 6.4 `npm run storybook` — eyeball every new primitive story and the editors' controls for
      visual parity with pre-change. (Manual visual check — pending.)
- [x] 6.5 Grep confirms no `addMainStatPref` / `updateMainStatPref` / `removeMainStatPref` and no
      per-editor select/sub-stat CSS remain. (Only a stale doc ref + `.rarity-btn-row` prefix match;
      updated `components.md`.)
- [x] 6.6 Migration-invariant gate (design D9): confirm the primitives still expose the query handles
      the existing tests pin — `name=` forwarded on `Select`; canonical classes `.substat-row` /
      `.remove-substat` / `.add-substat-btn` / `.remove-pref-btn` / `.pref-chain` / `.level-slider` still
      emitted; `SegmentedButtons` renders each option `label` as button text with `active` on that button
      and accepts the host row-wrapper `className`; `SubStatList` value input keeps its `placeholder`.
      Any handle renamed → fix the primitive, do not rewrite the assertions.
