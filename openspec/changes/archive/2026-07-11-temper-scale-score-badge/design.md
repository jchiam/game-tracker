# Design: temper-scale-score-badge

## Context

`ScoreBadge` (`src/components/ScoreBadge.tsx`) is the single shared roster-card score readout, rendered by HSR/N2E `CharacterCard` and P5X `ThiefCard` through `GameCardShell`'s `headerExtra` slot. It currently renders a flat grade-tinted pill. The Temper foundation (merged, `78a1de1`) established the ramp anchors as `color.temper.*` tokens and the data/display font roles; the approved mockup shows the card score as a number + grade letter + miniature ramp rail with a marker at the score position. The badge renders over card art inside `.game-card-controls-bottom`, so legibility over arbitrary images is a constraint. Existing consumer tests assert `.score-badge.grade-{g}` presence and `NN%` text — both must survive.

## Goals / Non-Goals

**Goals**

- Replace the pill with the mockup's rail readout: percentage (data face, grade colour), grade letter (display face), 3px full-ramp rail with a marker at score%.
- Keep the public contract: `score` prop, negative-sentinel hide, `.score-badge` + `grade-{s..d}` classes.
- Add the ramp gradient as a canonical token so the rail (and future rail surfaces) never hand-write the gradient.

**Non-Goals**

- No change to scoring logic, `getScoreGrade` boundaries, or consumers' props.
- No anodized card edge (change 3, separate).
- No notches on the mini rail — grade-boundary notches belong to the full-size scale visualisation (mockup hero), not the 64px badge rail; at that width they'd read as noise.

## Decisions

### D1 — Marker position via inline custom property

The component sets `style={{ '--score-pos': `${score}%` }}` on the rail element; CSS positions a `::after` marker with `left: var(--score-pos); transform: translateX(-50%)`. Alternative — inline `left` style on a child element — works but leaks layout into TSX; the custom property keeps all presentation in CSS and matches the mockup's `--pos` pattern. Score is already clamped 0–100 by the scorers; `translateX(-50%)` centres the tick so 0 and 100 stay visually on the rail.

### D2 — Anatomy: readout line over rail

Root `.score-badge grade-{g}` (contract preserved) containing:

```
<div class="score-badge grade-s">
  <span class="score-badge-readout">
    <span class="score-badge-value">92%</span>
    <span class="score-badge-grade">S</span>
  </span>
  <span class="score-badge-rail" style="--score-pos: 92%" />
</div>
```

Value: data face, tabular-nums, coloured `var(--color-score-grade-{g})`. Grade letter: display face, xs, letter-spaced, `--color-text-secondary`. Rail: ~64px × 3px, `background: var(--gradient-temper-ramp)`, radius, porcelain marker tick (2px × 8px, `--color-text-primary`). Two-line column keeps the badge within the pill's previous footprint (~64 × 26px) so the `headerExtra` row layout is untouched. The mockup's large-number treatment is for its own card concept; the badge keeps xs/sm sizing to fit the real shell.

### D3 — Ramp gradient as a Style Dictionary token

New top-level group in `design-tokens.json`:

```json
"gradient": {
  "temperRamp": {
    "$value": "linear-gradient(90deg, {color.temper.rust} 0%, {color.temper.amber} 33%, {color.temper.gold} 67%, {color.temper.verdigris} 100%)"
  }
}
```

Compiles to `--gradient-temper-ramp` with resolved hexes (Style Dictionary resolves `{ref}` inside string values). Stop positions 0/33/67/100 mirror `COLOR_STOPS` in `progressGradient.ts`; a comment there already locks anchors to the tokens — extend it to note the gradient token mirrors the stop positions. Alternative — hand-written gradient in `ScoreBadge.css` — rejected: the spec's token-first rule and change 3 (anodized edge) will want the same gradient.

### D4 — Legibility backing stays neutral

The pill's grade-tinted fill dies, but the badge keeps a neutral dark glass backing (`rgba(0,0,0,…)` — a sanctioned neutral literal per shared-design-tokens) with small padding/radius so the readout and rail survive bright card art. Grade colour now lives only in the percentage text; the rail is identical across grades (the marker position, not the hue, encodes the score).

### D5 — Tests assert the new anatomy, consumers near-untouched

New `ScoreBadge.test.tsx`: renders value + grade letter, `--score-pos` equals `${score}%`, negative score renders nothing, grade class matches boundaries (30/50/70/90 edges). Consumer tests asserting `.score-badge.grade-{g}` presence and `NN%` via `getByText` pass unchanged; two exact-textContent assertions (N2E `CharacterCard.test.tsx`, P5X `ThiefCard.test.tsx`) and the e2e typography probe (`tests/design-tokens.spec.ts`) retarget `.score-badge-value`, since the badge's textContent now appends the grade letter and the data font role lives on the value element. Stories: update `ScoreBadge.stories.tsx` for the new anatomy (grades, sentinel, all-grades row already exist — verify rendering); document `--gradient-temper-ramp` in `DesignTokens.stories.tsx`.

## Risks / Trade-offs

- [Style Dictionary may not resolve refs inside a composite string value in this config] → verify compiled `tokens.css` contains resolved hexes as part of the build task; if unresolved, fall back to literal hexes with a lock comment mirroring `COLOR_STOPS`' contract.
- [Badge grows a second line; header-actions row alignment could shift] → footprint kept ≤ previous pill height via xs sizing; verify visually in Storybook and on a game page.
- [Marker tick contrast over gold/verdigris segment] → porcelain `#e9e4d8` tick with the dark glass backing behind the whole badge; tick spans above/below the 3px rail so it reads by shape as well as colour.

## Migration Plan

Single deploy; no data or API surface. Rollback = revert commit.

## Open Questions

None.
