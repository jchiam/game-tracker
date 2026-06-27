## Context

N2E `CharacterCard` (`src/pages/neverness-to-everness/components/CharacterCard.tsx`) currently renders four blocks in `.game-card-static-summary`: stat chips (Lv + A n/6), a one-line arc·cartridge digest, a clickable `.cartridge-slot-section` that opens `CartridgeEditorModal`, and a conditional `.cartridge-target-build` showing the full preferences display. The edit body holds only Level slider, Awakening row, and Arc controls. The inline budget is 400px summary / 1200px edit.

Changes A–C are landed: `getProgressStyle` available, canonical collapse classes in `card.css`, inline height budgets on each card root (no cross-game leak).

## Goals / Non-Goals

**Goals:**

- Slim the N2E collapsed summary to ≈100px: chips row + one-line equip digest.
- Add a cartridge score chip (`Cart {score}%`) to the chips row when preferences exist.
- Move the cartridge slot (click-to-edit affordance) and Target Build display into the edit body.
- Drop the summary height budget from 400px to ~100px.

**Non-Goals:**

- No changes to `CartridgeEditorModal` internals.
- No changes to cartridge scoring, data model, services, or hooks.
- No changes to `card.css` structural rules (already canonical).
- Not adding new design tokens (existing gradient + chip styles suffice).

## Decisions

**Decision: Cartridge info in summary = read-only one-liner, not the clickable slot.**
The cartridge slot opens a modal (an editing affordance) — per P1 it belongs in the edit body. The summary shows only: `{cartridgeName} {rarity} Lv{level}` as a teal-colored span appended to the arc digest line with a `·` separator. When no cartridge is equipped and no arc is equipped, the line shows `—` (the existing `.no-equip` span).

**Decision: Cartridge score chip = `Cart {score}%` in the stat chips row.**
Show a third `StatChip` labeled `Cart {score}%` only when `hasCartridgePrefs && cartridgeScore >= 0`. Colored by `getProgressStyle(cartridgeScore, 0, 100)`. This replaces the full Target Build display as the summary-level indicator of build progress. The existing score badge in the header overlay (grade-based: S/A/B/C/D) remains unchanged — it serves a different role (quick visual grade at a glance on the image).

**Decision: Target Build moves to edit body as a read-only block below the cartridge slot.**
Full detail (Set chain, Main chain, Subs chain, comments) preserved exactly as-is. It renders inside `.game-card-edit-body-inner` after the cartridge slot section. Not editable from here (editing is via `CartridgeEditorModal`). The `.cartridge-target-build` CSS is retained unchanged.

**Decision: Cartridge slot moves to edit body as the last interactive section.**
The `.cartridge-slot-section` (with its `section-header` + clickable `.cartridge-slot`) moves into `.game-card-edit-body-inner` after the Arc section. Its click handler (`setIsCartridgeEditorOpen(true)`) and all existing styles are retained unchanged.

**Decision: Summary height budget drops to 100px.**
Chips row (~32px) + one-line equip (~20px) + spacing ≈ 60px rendered. 100px provides headroom for chip wrapping on narrow viewports. Edit budget stays 1200px (the edit body is now larger: Level + Awakening + Arc + Cartridge slot + Target Build ≈ 700–800px).

**Decision: Arc level and tier info NOT in the summary one-liner.**
Keep the one-liner short: arc name only (like r1999 shows psychube name, not level). Arc level/tier are edit-body concerns. The arc name color is gradient-based (teal when equipped, rust when not).

## Risks / Trade-offs

- **[Test assertions move]** Elements that were in the always-visible summary (cartridge slot, Target Build) are now in the edit body (still in DOM, just behind `max-height: 0`). Tests using `getByText` will still find them in jsdom, but interaction tests that click the cartridge slot must first open edit mode. Update tests accordingly.
- **[Score chip adds visual weight to the chips row]** Three or four chips (Lv + A + optional Cart%) could wrap on very narrow cards. The 100px budget accommodates one wrap; if it's too tight in practice, bump to 120px.
- **[Information density trade-off]** Moving Target Build out of always-visible means users must expand to see it. Mitigated by the `Cart {score}%` chip — the summary tells you "how close to target" at a glance; expand for detail.
