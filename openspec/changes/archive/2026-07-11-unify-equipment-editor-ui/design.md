## Context

`unify-equipment-scoring` (archived 2026-07-10) unified the scoring mechanism and the score badge across HSR relics, N2E cartridges, and P5X revelations. The editor UI around that mechanism still ships three interaction models:

- **HSR** — card shows a 6-slot relic grid; clicking a slot opens `RelicEditorModal` scoped to **that one slot**. Full gear entry costs six open/close cycles. The Build Preferences tab is fragmented: it shows only the opened slot's main-stat chain (plus the global sub/set/comments sections), so the user never sees all four main chains at once and global sections read as slot-scoped.
- **P5X** — card shows a text set readout + "Edit Revelations" button; the modal edits **all five slots** in one scrollable Equip tab and has a complete-ish Preferences tab (missing `BuildComments`). No visual slot grid, no slot-level deep link, no un-equip footer (clear via set "None").
- **N2E** — single-slot game; both tabs complete. Drift only: duplicate `Cart {n}%` score chip next to the header `ScoreBadge`, and a custom-markup Target Build readout instead of `ProgressSection`.

User decisions (AskUserQuestion, this session): anchor-scroll all-slots modal (over slot-selector row and keep-per-slot); P5X gets an HSR-style slot grid.

## Goals / Non-Goals

**Goals:**

- One interaction model: slot-grid entry on card → single all-slots editor modal, anchor-scrolled to the clicked slot → one complete Build Preferences tab (sets → per-slot mains → subs → comments).
- Badge is the only numeric score surface on the card.
- Target Build read-only readout on all three cards, via `ProgressSection`.
- Primitive compliance riders: `LevelSlider` / `Select` replace raw `<input type="range">` / `<select>` on HSR and N2E cards.

**Non-Goals:**

- No scoring changes — `src/utils/scoring/`, per-game scorers, weights, sentinel, grades all untouched.
- No collapsed-summary layout uniformity beyond the N2E chip removal. P5X keeps its persona static line and its score-colored consolidated revelation chip (that chip _is_ the gear digest and is heavily specced — width cap, two-line reserve, lossless consolidation); HSR/N2E keep their gear one-liner. Forcing one summary layout would undo deliberate per-game specs for no information gain.
- AE weapon editor and R1999 psychube UI are out of scope (no match-scoring editor parity to converge on).
- No shared `SlotEquipCard` **component** (see Decisions — CSS is shared, JSX stays per-game).

## Decisions

### D1 — Anchor scroll, not slot selector

The Equip tab renders every slot as a vertical slot card (P5X's current pattern). The modal takes an optional `anchorSlot`; on mount, the anchored slot card scrolls into view (`el.scrollIntoView?.({ block: 'start' })` — optional-call because jsdom lacks `scrollIntoView`). Chosen over a segmented slot-selector row because it keeps sibling slots visible (cross-slot context while editing) and needs no new selection state. HSR's page-level editing state changes from `{ charId, slot }` to `{ charId, anchorSlot }` — the slot no longer scopes the modal, only the initial scroll.

### D2 — HSR modal rework shape

`RelicEditorModal` adopts the P5X component structure: an `EquipTab` mapping the six slots to slot cards (set `Select` filtered by slot family `1*`/`3*`, main `Select` or fixed read-only stat for head/hands, `SubStatList`), and a `PreferencesTab` showing **all four** variable-slot main chains (body, feet, sphere, rope), the global substat chain, both set-preference `Select`s, and `BuildComments`. Save wiring stays per-slot: existing `saveRelicData({ charId, slot }, relicData)` and `removeRelicData({ charId, slot })` hook functions are unchanged; the modal calls them with the slot card's own slot. Choosing set "None" on a slot card triggers the remove path (delete row), replacing the footer "Un-equip Relic" button — same semantics P5X ships today. The footer keeps only "Done".

### D3 — Slot grid CSS is shared; slot-card CSS is shared; JSX stays per-game

Two patterns extract to L2:

- `.equip-slot-grid` / `.equip-slot-cell` (card entry grid) into `src/styles/card.css` — HSR's `.relics-grid`/`.relic-slot` rules migrate to these canonical names; P5X composes them for its new 5-cell grid; N2E's single cartridge chip is left as-is (its slot chip carries rarity/level/subs text, a different shape, and a 1-cell grid buys nothing).
- `.equip-slot-card` / `.equip-slot-header` (modal slot section) into `src/styles/controls.css` — P5X's `.rev-slot-card`/`.rev-slot-header` rules migrate; HSR's new Equip tab uses them.

No shared `SlotEquipCard` React component: the two games differ in set-catalog filtering (HSR slot-family prefix vs P5X Heavens/Space catalogs), fixed-main semantics (HSR two fixed single-stat slots vs P5X one stored fixed + one derived dual-fixed), and stat option shapes (strings vs `{value,label}`). A config seam covering all that would be bigger than the ~80 lines it saves per game; the shared primitives (`Select`, `FormGroup`, `SubStatList`) already carry the real reuse.

### D4 — P5X slot grid uses glyphs

No set icon art exists for revelation sets (no `icon` field in the catalog, nothing on the CDN). Grid cells show per-slot glyphs — ☀ (sun), ☽ (moon), ★ (star), ☁ (sky), ◈ (space) — with the active state (equipped = non-null `setId`) using the existing active-cell styling. This mirrors HSR's existing glyph fallback (⬡/○) rather than inventing an asset pipeline for five icons. The grid replaces both the text set readout and the "Edit Revelations" button in the Revelations `ProgressSection`; clicking a cell opens the modal anchored to that slot. Set names remain visible on the collapsed summary chip and in the modal.

### D5 — P5X comments persist as a parent column

`P5xRevelationPreferences` gains `comments: string`. Persistence mirrors HSR/N2E exactly: a `build_comments TEXT` column on `p5x_tracked_thieves`, written through `savePreferenceRows`' existing `parentUpdate` seam by `thiefService.saveRevelationPreferences`. Chosen over a `category='comments'` preference row because comments are scalar free text, not an ordered stat row, and the parent-column pattern is what the other two games already do — one convention, not two.

### D6 — N2E cleanup scope

Remove the `Cart {score}%` chip from the collapsed summary (header `ScoreBadge` is the score surface). Convert the Target Build readout and the cartridge slot section from custom `.cartridge-target-build` / `.cartridge-slot-section` markup to `ProgressSection` wrappers ("Target Build", "Cartridge"), matching HSR. Drop the redundant `hasCartridgePrefs` guard in front of `calculateCartridgeScore` — the scorer owns the `-1` sentinel. Keep the footer "Un-equip Cartridge" button: in a single-item modal it is the per-item clear, not a redundancy.

### D7 — Primitive riders ride along

HSR card level slider, N2E card level + arc sliders → `LevelSlider`; N2E arc picker → `Select`. These are CLAUDE.md build-preference-primitive violations sitting in files this change already rewrites; fixing them separately would churn the same lines twice. P5X card is already compliant.

## Risks / Trade-offs

- [HSR all-slots modal is taller than the old single-slot modal] → Modal body already scrolls (P5X proves the pattern at 5 slots); anchor scroll lands the user on the intended slot.
- [Set "None" now deletes the slot's relic (main/subs lost) without the explicit footer button] → Same semantics P5X ships today; the modal stays open so re-entry is immediate. Accepted for consistency.
- [Migrating HSR grid / P5X slot-card class names breaks per-game CSS overrides silently] → Both CSS files are edited in the same change; tests assert the canonical class names.
- [`scrollIntoView` missing in jsdom] → optional-call (`?.()`); anchor behavior asserted via a spy on `Element.prototype.scrollIntoView` where worth testing.
- [P5X `build_comments` migration must precede deploy of the service change] → Additive nullable column; old clients ignore it, new code defaults `''`. No rollback hazard.

## Migration Plan

1. Migration `20260710000007_p5x_add_build_comments.sql`: `ALTER TABLE p5x_tracked_thieves ADD COLUMN IF NOT EXISTS build_comments TEXT;` (additive, no backfill).
2. Ship code. Rollback = revert commit; the column is inert if unused.

## Open Questions

None — modal navigation and P5X entry were resolved by user decision; comments persistence follows the existing parent-column convention.
