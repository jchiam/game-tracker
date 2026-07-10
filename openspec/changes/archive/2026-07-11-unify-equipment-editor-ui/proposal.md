## Why

The scoring mechanism was just unified (`unify-equipment-scoring`), but the equipment-editing UI still ships three different designs: HSR opens one modal per relic slot (six open/close cycles for full gear entry, preferences fragmented across per-slot modals), P5X hides its five slots behind a text button with no visual slot grid and its preferences tab has no comments field, and N2E duplicates the score as both a header badge and a `Cart {n}%` chip while rendering its Target Build readout with custom markup instead of `ProgressSection`. The three games should share one editor interaction model: slot-grid entry on the card → one all-slots editor modal anchored to the clicked slot → one complete Build Preferences tab.

## What Changes

- **Card entry — slot grid everywhere.** HSR keeps its 6-slot relic grid. P5X replaces the "Edit Revelations" button + text set readout with a 5-slot glyph grid (Sun/Moon/Star/Sky/Space; no set art exists, so slot glyphs with active styling — same fallback pattern HSR already ships). N2E keeps its single cartridge slot chip (degenerate 1-slot grid).
- **Editor modal — unified all-slots editor.** **BREAKING (HSR UX):** `RelicEditorModal` is reworked from one-slot-per-open to a single all-slots editor (P5X pattern: vertical slot cards on the Equip tab). Opening from a card slot scrolls/anchors that slot into view. P5X gains the same anchor behavior. N2E modal shape unchanged (one slot).
- **Preferences tab — complete in one place.** Every game's Build Preferences tab shows: preferred set(s) → per-slot main-stat chains → substat chain → comments. HSR de-fragments (all four variable-slot main chains visible at once instead of only the opened slot's). P5X gains a `BuildComments` field (new `build_comments` column on `p5x_tracked_thieves`, mirroring HSR/N2E parent-column persistence).
- **Un-equip semantics.** Per-slot clear via the set `Select`'s "None" option in multi-slot editors; the footer "Un-equip" danger button remains only in N2E's single-item modal and is dropped from HSR's reworked modal.
- **Score surface — badge only.** N2E's duplicate `Cart {score}%` summary chip is removed; the header `ScoreBadge` is the sole score display (P5X's score-colored revelation set chip stays — it is the gear digest, colored by score, not a second numeric score).
- **Target Build readout on every card.** P5X card gains the read-only Target Build preferences display in its edit body; N2E's converts from custom `cartridge-target-build` markup to the shared `ProgressSection` wrapper (matching HSR).
- **Primitive-compliance riders.** HSR and N2E card level/arc sliders convert from raw `<input type="range">` to `LevelSlider`; N2E's arc picker converts from raw `<select>` to `Select`. N2E card drops its redundant `hasCartridgePrefs` gate in front of `calculateCartridgeScore` (the scorer owns the `-1` sentinel).

## Capabilities

### New Capabilities

- `shared-equipment-editor`: Cross-game equipment editor interaction contract — slot-grid card entry, single all-slots editor modal with Equip/Build Preferences tabs, anchor-scroll to the opened slot, complete preferences tab composition (sets → per-slot mains → subs → comments), per-slot clear semantics, Target Build card readout, and the badge-is-the-only-score-surface rule.

### Modified Capabilities

- `hsr-character-detail`: Relic editor modal becomes a single all-slots editor (anchor-scrolled from the card's relic grid); Build Preferences tab shows all four variable-slot main-stat chains at once; footer "Un-equip" removed in favor of per-slot clear; card level slider becomes `LevelSlider`.
- `n2e-character-detail`: `Cart {score}%` summary chip removed from the collapsed summary composition; Target Build readout renders via `ProgressSection`; card level/arc sliders become `LevelSlider` and arc picker becomes `Select`.
- `p5x-thief-detail`: Edit-body Revelations section replaces the text readout + "Edit Revelations" button with a 5-slot glyph grid that opens the editor anchored to the clicked slot; the consolidated set readout requirement is superseded by the grid (the summary chip remains the set digest).
- `p5x-revelation-preferences`: Adds an optional free-text `comments` field to `revelationPreferences`, persisted as a `build_comments` column on `p5x_tracked_thieves` (parent-column pattern, like HSR/N2E).
- `shared-ui-components`: The build-preference editor modal layout pattern reclassifies HSR as a multi-slot editor (slot grouping cards, like P5X) and moves the slot grouping-card rule from per-game CSS into shared `controls.css` (`.equip-slot-card`), leaving per-game CSS with only the body layout rule.

## Impact

- **Components:** `RelicEditorModal.tsx` (major rework), `RevelationEditorModal.tsx` (anchor prop, comments field), `HsrPage.tsx` (editing state becomes `{charId, anchorSlot}`), `ThiefCard.tsx` (slot grid, Target Build readout), N2E `CharacterCard.tsx` (chip removal, ProgressSection conversion, primitive riders), HSR `CharacterCard.tsx` (LevelSlider rider, modal open wiring).
- **CSS:** HSR `RelicEditorModal.css` (slot-card layout), P5X `ThiefCard.css` (slot grid), N2E `CharacterCard.css` (target-build cleanup). Possible shared extraction of the slot-grid pattern into `card.css`/`controls.css` — decided in design.
- **Types/DB:** `P5xRevelationPreferences.comments`; migration adding `build_comments TEXT` to `p5x_tracked_thieves`; `thiefService` select/fromRow/save updates.
- **Tests:** `RelicEditorModal.test.tsx` (rework), `ThiefCard.test.tsx`, N2E `CharacterCard.test.tsx`, `RevelationEditorModal.test.tsx`, `thiefService.test.ts`.
- **No scoring changes** — `src/utils/scoring/` and all scorers untouched.
