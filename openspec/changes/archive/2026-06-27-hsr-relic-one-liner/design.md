## Context

HSR `CharacterCard` (`src/pages/honkai-star-rail/components/CharacterCard.tsx`) has a collapsed summary with three stat chips (`Lv`, `Traces ✓/✗`, `Relics n/6`) but no `.game-card-static-line`. The card tracks 6 relic slots, each with a `setId` referencing `ALL_RELIC_SETS` (from `src/data/honkai-star-rail/relic_sets.ts`). The `Relics n/6` chip already counts equipped slots; this adds set-name context.

## Goals / Non-Goals

**Goals:**

- Add a gear one-liner to HSR's collapsed summary showing relic set names + counts.
- Match the visual language of R1999/N2E equip lines (teal color, `·` separators, dash empty state).

**Non-Goals:**

- No relic scoring changes.
- No new utility file (logic is trivial and local).
- No CSS additions (reuse `.game-card-static-line` from `card.css`).
- Not abbreviating or truncating set names (CSS handles overflow).

## Decisions

**Decision: Show all equipped sets regardless of slot completeness.**
Any slot with a `setId` contributes. Sets sorted by count descending, separated by `·`. Even partial fills like `Firesmith 2 · Champion 1` are shown. Dash only when zero relics equipped. Rationale: always giving info is more useful at a glance than hiding partial state.

**Decision: Full set names, CSS handles overflow.**
Set names like "Amphoreus, The Eternal Land" can be long. `.game-card-static-line` already has `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`. No programmatic truncation needed.

**Decision: Teal color for all set text, rust for empty dash.**
Same as R1999's psychube line and N2E's equip line: `getProgressStyle(90, 1, 90).color` for equipped, `getProgressStyle(0, 0, 1).color` for the dash. No per-set color differentiation.

**Decision: Set-counting logic inline in the component.**
~5 lines using `Array.reduce` → `Map<string, number>` → sorted entries. Not worth extracting to a utility given it's used in one place.

**Decision: Height budget stays at 100px.**
The one-liner adds ~20px. Current budget (100px) already accommodates chips + one line (same as N2E after Change D).

## Risks / Trade-offs

- **[Long set names may truncate]** The longest HSR set name is ~30 chars. With 2 sets + counts + separators that's ~70 chars. `.game-card-static-line` ellipsis handles overflow gracefully. Acceptable trade-off for no truncation logic.
- **[3+ sets can look busy]** A character with 6 different sets (one per slot) would show 6 entries. In practice this is rare (users tend toward 4+2 or 2+2+2). The text just truncates via ellipsis on narrow cards.
