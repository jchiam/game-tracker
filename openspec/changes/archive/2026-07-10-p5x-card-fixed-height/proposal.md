## Why

P5X Thief cards vary in collapsed height because the summary chip row wraps to a
different number of lines per card (1–3), driven mainly by the variable-width
Revelations chip. This makes the roster grid look ragged. The card body already
sizes to its own measured content, so nothing equalizes height across cards.

## What Changes

- Reorder the collapsed-summary chips so the **Mindscape** chip precedes the
  **Revelations** chip: `Level → Awareness → Weapon → Mindscape → Revelations →
Skills`. Front-loading the short fixed-width chips packs line 1 tightly and
  pushes the single wide chip to start line 2 cleanly.
- **Reserve a fixed two-line height** for the P5X card's summary chip row so
  1-line cards no longer sit shorter than 2-line cards. Delivered as an opt-in
  seam on `GameCardShell` (P5X opts in; other games unaffected).
- **Cap the Revelations summary chip's width** and truncate its label with an
  ellipsis, so six chips never spill onto a third line. The full set name(s)
  remain visible in the Revelation editor modal.
- Edit-body section ordering is unchanged (`Level → Weapon → Revelations →
Mindscape → Skills`); only the collapsed summary chip order changes.

## Capabilities

### New Capabilities

- _None._

### Modified Capabilities

- `p5x-thief-detail`: summary chip dimension ordering changes (Mindscape before
  Revelations); the Revelations summary chip gains a max-width + ellipsis cap;
  the P5X card's collapsed summary has a fixed two-line reserved height.
- `shared-card-collapse`: `GameCardShell` gains an opt-in fixed-height reserve
  for the summary chip row (unused by default — no change to existing games).

## Impact

- `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — chip render order;
  className on the Revelations `StatChip`; opt into the shell reserve.
- `src/pages/persona-5-phantom-x/components/ThiefCard.css` — Revelations chip
  max-width + ellipsis rule.
- `src/components/GameCardShell.tsx` — optional prop for the summary reserve.
- `src/components/StatChip.tsx` — optional `className` passthrough (enabler for
  the per-chip width cap).
- `src/styles/card.css` — reserve rule keyed off the opt-in class.
- Tests: `ThiefCard.test.tsx`, `GameCardShell.test.tsx` (new behavior);
  Storybook `CardPatterns` if the reserve is documented.
- No DB, API, or data-pipeline impact. Pure presentational change.
