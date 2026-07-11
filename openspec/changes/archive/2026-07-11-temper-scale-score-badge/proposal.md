# Proposal: temper-scale-score-badge

## Why

The Temper foundation (change `temper-foundation-tokens`, merged) promoted the investment ramp (rust → amber → gold → verdigris) to brand and made the Temper Scale — a rail with grade boundaries at 30/50/70/90 — the design language's signature motif. The roster-card `ScoreBadge` is the one place a score is shown app-wide, yet it still renders as a flat grade-tinted pill that doesn't express the scale. Replacing the pill with a miniature Temper rail makes the signature visible where scores actually live, per the approved mockup.

## What Changes

- `ScoreBadge` renders as a miniature Temper rail readout instead of a flat pill: the rounded percentage (data face, grade colour), the grade letter, and a thin full-ramp gradient rail with a marker positioned at the score.
- The negative-sentinel behaviour is unchanged: negative score renders nothing.
- The `grade-{s..d}` class contract and the `--color-score-grade-*` ramp remain the colour source; the rail gradient reuses the same ramp anchors (Temper tokens).
- A ramp-gradient token is added to `design-tokens.json` (the rail's `linear-gradient` background) so the rail and any future rail-styled surface share one canonical gradient.
- Storybook `ScoreBadge` stories updated for the new anatomy; unit/visual coverage of marker position and grade rendering.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shared-score-badge`: the "Shared score badge component" requirement changes from "renders a graded score pill" to "renders a graded Temper-rail readout" — percentage, grade letter, and a ramp rail with a marker at the score position. The negative-sentinel and grade-class/ramp-token requirements are retained.
- `shared-design-tokens`: adds a requirement that the Temper ramp gradient is a canonical token (single `linear-gradient` built from the `color.temper.*` anchors) referenced by rail-styled surfaces.

## Impact

- `src/components/ScoreBadge.tsx` — new markup (percentage, grade letter, rail + marker).
- `src/components/ScoreBadge.css` — rail styles replace pill fill/border; grade classes keep colouring the number.
- `src/styles/design-tokens.json` + regenerated `tokens.css` — new `gradient.temper-ramp` (or equivalent) token.
- `src/components/ScoreBadge.stories.tsx` — story updates.
- `src/styles/DesignTokens.stories.tsx` — document the new gradient token.
- Consumers (`CharacterCard` HSR/N2E, `ThiefCard` P5X) pass `score` only — no consumer changes expected; layout in `GameCardShell` header-extra slot must still fit.
- No DB, service, or scoring-logic changes; `getScoreGrade` boundaries untouched.
