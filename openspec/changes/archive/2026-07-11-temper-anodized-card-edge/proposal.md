# Proposal: temper-anodized-card-edge

## Why

The Temper design language's signature risk — approved in the mockup — is the "anodized edge": a 3px hairline crown on each roster card coloured by that card's equipment-match score position on the investment ramp, so a shelf of cards reads as a heat-treatment spectrum at a glance. Foundation tokens (`78a1de1`) and the ScoreBadge rail (`84a9a4a`) are merged; this is the final planned Temper change.

## What Changes

- `GameCardShell` gains an optional `temperScore` prop. When ≥ 0, the shell sets `--temper` (the ramp colour at that score, via the shared `getProgressStyle`) inline on the card root and tags it `has-temper-edge`; when omitted or negative (insufficient-data sentinel), the card renders exactly as today.
- `card.css` gains the edge rules once: a 3px top bar coloured `var(--temper)` with a `color-mix`-derived glow, glow intensifying on hover alongside the existing shared hover treatment.
- Scored games wire their existing card score into the prop: HSR `CharacterCard` (relic score), N2E `CharacterCard` (cartridge score), P5X `ThiefCard` (revelation score). R1999 and AE pass nothing — neutral fallback, no edge.
- Shell + consumer tests; Storybook CardPatterns note if applicable.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shared-ui-components`: ADDED requirement — `GameCardShell` renders the anodized temper edge from the optional `temperScore` prop (colour from the shared progress gradient; hidden on omitted/negative).
- `shared-card-base`: ADDED requirement — the anodized-edge rules live once in `card.css`, colour flows through the `--temper` inline custom property, glow derives via `color-mix`.

## Impact

- `src/components/GameCardShell.tsx` — new prop, inline `--temper`, `has-temper-edge` class.
- `src/styles/card.css` — edge + glow rules.
- `src/pages/honkai-star-rail/components/CharacterCard.tsx`, `src/pages/neverness-to-everness/components/CharacterCard.tsx`, `src/pages/persona-5-phantom-x/components/ThiefCard.tsx` — pass `temperScore`.
- Tests: `GameCardShell` slot/edge coverage; consumer card tests assert edge presence/absence.
- No DB, service, scoring, or token-value changes (`--temper` is an inline per-card property, not a new token; glow via `color-mix` per token discipline).
