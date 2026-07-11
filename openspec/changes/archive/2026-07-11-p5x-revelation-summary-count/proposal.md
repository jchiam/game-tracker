## Why

The P5X Thief card packs equipped revelation **set names** into a summary `StatChip`, so the chip's width depends on which sets are equipped. To stop the widest label (a Heavens 4pc set + a Space set) from spilling the chip row onto a third line, the chip carries a `max-width` + `text-overflow: ellipsis` band-aid — which truncates real information on the collapsed card. HSR's relic summary avoids this entirely: its chips are set-independent counts (`Relics 4/6`) and the variable set text lives on the free `summaryLine`. P5X should mirror that pattern so chip width is predictable and no set name is clipped.

## What Changes

- The Revelations summary `StatChip` becomes a **set-independent count** — `Rev {n}/5`, where `n` is the number of equipped revelation cards — colored by the same revelation-match-score gradient it uses today. Its width no longer depends on set names.
- The equipped **set names** (the space-first, lossless `getRevelationSummary` label) move off the chip and onto the card's `summaryLine`, joined with the existing bound-Persona name on the same line but **visually distinct** from it (set text carries the score-gradient color; the Persona name keeps its dim italic treatment; a divider glyph separates them).
- The `max-width` / `nowrap` / `text-overflow: ellipsis` cap on `.p5x-revelation-chip` is **removed** — a fixed-content count chip needs no cap, and no label is truncated anywhere.
- The fixed two-line collapsed-summary reserve is retained; its rationale updates (the count chip is now short and fixed, so the reserve simply holds a uniform height rather than absorbing a variable-width chip).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-thief-detail`: the collapsed-summary composition changes — the Revelations chip becomes a `Rev {n}/5` count instead of a variable set-name label; set names relocate to the `summaryLine` joined with the Persona name; the "Revelation summary chip width cap" requirement is removed; the Persona-name-line and consolidated-set-summary requirements are updated to reflect the new placement.

## Impact

- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — chip label + color, `summaryLine` composition.
- `src/pages/persona-5-phantom-x/components/ThiefCard.css` — delete `.p5x-revelation-chip` cap rules (base + `@media`); add `.rev-set-summary` + `.summary-divider`.
- `src/pages/persona-5-phantom-x/components/ThiefCard.test.tsx` — update chip-label and summary-line assertions.
- No data, service, hook, or persistence changes. `getRevelationSummary` helper is reused unchanged.
