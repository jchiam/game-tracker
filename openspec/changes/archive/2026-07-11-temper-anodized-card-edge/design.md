# Design: temper-anodized-card-edge

## Context

Final planned Temper change. The mockup's `.card-edge` is a 3px bar (`background: var(--temper); box-shadow: 0 1px 10px color-mix(in srgb, var(--temper) 55%, transparent)`) crowning each roster card, with `--temper` set per card to the ramp colour at its score. In the real app, cards render through `GameCardShell` (`src/components/GameCardShell.tsx`) over the `.game-card` skeleton in `card.css` (`overflow: hidden`, 1px token border, shared hover). Scores already exist per scored card: HSR `calculateRelicScore`, N2E cartridge score, P5X revelation score — the same values fed to `ScoreBadge`, with `-1` as the insufficient-data sentinel. The ramp colour function is `getProgressStyle(value, min, max)` (`src/utils/progressGradient.ts`), whose `.color` is the interpolated `rgb(...)` string.

## Goals / Non-Goals

**Goals**

- Optional, backwards-compatible `temperScore` prop on `GameCardShell`; edge only when ≥ 0.
- Edge CSS once in `card.css`, colour via inline `--temper`, glow via `color-mix`.
- Wire HSR/N2E/P5X. R1999/AE untouched.

**Non-Goals**

- No new design tokens — `--temper` is a per-card inline property (the leak-proof deviation form `shared-card-base` already sanctions), and its value is computed at runtime; the anchors live in tokens already.
- No edge on party cards, selection cards, or modals.
- No re-colouring of the shared hover border (stays `--color-brand-primary`); the edge glow layers on top.

## Decisions

### D1 — Pseudo-element edge, not a DOM child

The edge renders as `.game-card.has-temper-edge::before` — `position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--temper); box-shadow: 0 1px 10px color-mix(in srgb, var(--temper) 40%, transparent); z-index: 1`, with `.game-card` gaining `position: relative` (inert addition). Hover raises the mix to 60%: `box-shadow` transition appended to the card's enumerated transition list on the pseudo-element itself. Alternative — a `<div className="game-card-edge">` child like the mockup — adds a DOM node to every card and a slot-ordering concern in the shell; the pseudo-element needs neither. `overflow: hidden` on `.game-card` clips nothing (edge sits inside the border box) and the header image starts at the card top, so the edge overlays the image's first 3px — same as the mockup's visual.

### D2 — Shell computes the colour, not the consumers

`GameCardShell` maps `temperScore` → `getProgressStyle(temperScore, 0, 100).color` and sets `style={{ '--temper': color }}` on the root plus `has-temper-edge`. Consumers pass the raw score they already hold (`temperScore={score}`) — no game computes colours. Alternative — consumers pass a colour string — spreads gradient knowledge across games and invites drift from the ramp. Undefined and negative collapse to the same no-op branch, mirroring `ScoreBadge`'s sentinel handling.

### D3 — Glow percentages: 40% rest, 60% hover

Mockup uses a single 55%. Live cards sit in a denser grid than the mockup shelf, so rest state drops to 40% to keep the shelf calm; hover takes 60% as the interactive reward. Both via `color-mix`, satisfying the token discipline (no hardcoded hue). The existing `.game-card:hover` border/shadow rules are untouched.

### D4 — Tests at both layers

Shell: new cases in the `GameCardShell` test file — `temperScore={92}` yields class + inline `--temper` matching `getProgressStyle(92,0,100).color`; `temperScore={-1}` and omitted yield neither. Consumers: one case each (HSR/N2E/P5X card tests) asserting the scored fixture's card root carries `has-temper-edge` and the sentinel fixture doesn't. jsdom can't assert the pseudo-element's paint; the class + property assertions cover the contract, the CSS is reviewed statically (matches how other card CSS is verified).

## Risks / Trade-offs

- [Edge invisible over very bright card art top rows] → 3px solid + glow reads on the sampled art; verified visually before sign-off.
- [`position: relative` on `.game-card` could re-anchor an existing absolute descendant] → `.game-card-header` is already `position: relative` and owns the absolute controls/overlay; no descendant anchors to the card root today (grep-verified during apply).
- [Hover box-shadow transition on a pseudo-element repaints the glow] → shadow-only transition on a 3px strip; negligible.

## Migration Plan

Single deploy; no data changes. Rollback = revert commit.

## Open Questions

None.
