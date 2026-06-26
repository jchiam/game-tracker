## Why

HSR's `CharacterCard` is the only roster card with no collapse mechanism — every card renders its level slider, traces checkbox, 6-slot relic grid, and (when present) the full Target Build inline, always. Card height swings with whether build preferences exist, so the roster grid is visually uneven while scrolling, and HSR diverges from the clean read-only-summary pattern that r1999, N2E, and AE now share. It also doesn't use the shared investment-gradient color language. This is the headline gap in the card-consistency effort; the two foundations it needs — the shared `getProgressStyle` util (Change A) and the canonical `.game-card-*` collapse classes (Change B) — are now in place.

## What Changes

- Add the collapse pattern to HSR `CharacterCard`: an `isEditing` toggle, a read-only `.game-card-static-summary`, and a `.game-card-edit-body`, using the canonical classes from `shared-card-collapse`.
- **Collapsed summary** = three gradient-colored stat chips: `Lv {level}`, a traces indicator (`Traces ✓` / `Traces ✗`), and a relic slot-fill chip `Relics {n}/6` (colored rust→teal by completeness). The existing relic-score badge stays in the card-image overlay.
- **Edit body** (behind the ✎ toggle) = the existing Level slider, Traces checkbox, Relic Sets grid, and Target Build display — moved out of the always-on body.
- Add an `edit-toggle-btn` to the header overlay (alongside the score badge), mirroring N2E's overlay-right grouping.
- Adopt the shared gradient: import `getProgressStyle` for the three chips and the level-slider fill (replacing HSR's flat `var(--color-brand-primary)` fill).
- Set HSR's two collapse height budgets via the canonical CSS custom properties.
- Update `CharacterCard.test.tsx` for the collapsed/expanded structure.

## Capabilities

### New Capabilities

<!-- None. The collapse mechanism is owned by shared-card-collapse (Change B); this change applies it to HSR and specifies HSR's summary composition. -->

### Modified Capabilities

- `hsr-character-detail`: Add a requirement for the character card's collapse presentation — the composition of the collapsed summary (Lv / Traces / Relics n/6 chips) and the edit-body contents. Existing data-field requirements (level, traces, relics, build prefs, sort) are unchanged.
- `shared-card-collapse`: Correct the per-game height-budget mechanism — set the budgets as inline custom properties on each card root instead of via a shared `.game-card { … }` rule in route-split CSS, which leaked across games after SPA navigation (Change B defect surfaced during this change). Touches r1999, N2E, and HSR card roots.

## Impact

- **Modified:** `src/pages/honkai-star-rail/components/CharacterCard.tsx` (collapse structure + gradient + inline budgets), `CharacterCard.css` (summary-chip tweaks; budget vars moved inline), `CharacterCard.test.tsx` (collapsed/expanded assertions).
- **Cross-game scoping fix:** `src/pages/reverse1999/components/ArcanistCard.{tsx,css}` and `src/pages/neverness-to-everness/components/CharacterCard.{tsx,css}` — move the height budgets from `.game-card {}` rules to inline custom properties on the card root.
- **Builds on:** `extract-shared-progress-gradient` (gradient util) and `canonical-card-collapse-classes` (collapse classes). **Unblocks/relates to:** Change D (N2E summary slimming) is independent; this completes the collapse pattern across all four games.
- **No DB, API, data, or scoring changes.** The relic score and `calculateRelicScore` are untouched; the score badge keeps its current overlay placement and tier logic.
- **Out of scope:** HSR's header still uses a bare `<img>` (no loading spinner / `game-card-image-wrapper`) unlike the other three cards — a separate consistency gap, not addressed here to keep this change focused on collapse.
