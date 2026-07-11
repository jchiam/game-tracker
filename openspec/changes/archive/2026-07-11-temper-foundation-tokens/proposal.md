## Why

The approved "Temper" design language (mockup reviewed 2026-07-11) promotes the existing investment gradient to the app's brand identity and replaces the current cool-grey "dark cosmic" neutrals and the externally-loaded Inter webfont with a warm, system-native foundation. This change lays that foundation at L1 (tokens + global chrome) so the follow-up changes (ScoreBadge temper rail, GameCardShell anodized edge) build on stable tokens.

## What Changes

- **Neutrals re-pointed** in `design-tokens.json` (values only, token names unchanged): background ground moves from `#0a0a0f` to Ink `#0e1014`; surfaces move to Slate `#1a1e26`-derived glass values; primary text moves from `#f0f0f5` to Porcelain `#e9e4d8`; secondary/dim text become warm Porcelain derivatives that keep WCAG AA.
- **Temper ramp anchor group added**: `color.temper.{rust,amber,gold,verdigris}` becomes the canonical named home of the four gradient anchors (`#8a6050`, `#c88040`, `#d4af37`, `#40c8a0` — values identical to `shared-progress-gradient` stops). Score-grade tokens (`color.score.gradeS/A/B/D`) become Style Dictionary references to these anchors instead of repeating literals; `gradeC` stays the standalone intermediate `#b48c64`.
- **Typography role tokens added**: `typography.fontFamily.display` (Bahnschrift stack — card names, section labels, grade letters), `typography.fontFamily.data` (Cascadia Mono stack — numerals with `tabular-nums`), and `typography.fontFamily.base` re-pointed from Inter to a Segoe UI system stack.
- **External webfont removed**: the Google Fonts `@import` for Inter is deleted from `src/index.css`; font hosts (`fonts.googleapis.com`, `fonts.gstatic.com`) are dropped from the CSP in `vercel.json`. The app loads zero external fonts.
- **Global chrome applies the roles**: `index.css`/shared styles apply the display face to headings, card names, and section labels, and the data face + `tabular-nums` to numeral surfaces (level values, stat chips, score badge).
- **Storybook updated**: `DesignTokens.stories.tsx` reflects new neutrals, temper anchors, and font roles; `InvestmentGradient.stories.tsx` gains the temper naming.

Explicit non-goals (later changes): ScoreBadge temper-rail redesign, GameCardShell anodized edge, any component-structure change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `shared-design-tokens`: two added requirements — (1) typography role tokens: three system-native font-family roles (display / base / data) with no external font loading permitted; (2) temper ramp anchors: `color.temper.*` is the canonical named token group for the four gradient anchor colours, and score-grade tokens reference the anchors rather than duplicating literals.

## Impact

- `src/styles/design-tokens.json` + regenerated `src/styles/tokens.css` (`npm run build:tokens`)
- `src/index.css` — Google Fonts `@import` removed; display/data role application
- `src/styles/card.css`, `src/styles/controls.css`, `src/components/ScoreBadge.css` — font-role hookup for card names, section labels, numerals (no structural changes)
- `vercel.json` — CSP font hosts removed; `npm run verify:csp` re-run
- `src/styles/DesignTokens.stories.tsx`, `src/styles/InvestmentGradient.stories.tsx`
- No TypeScript, service, hook, or DB changes. `progressGradient.ts` anchors untouched (values already match).
- Risk: app-wide hue/type shift in one commit — visually loud, structurally trivial; WCAG AA requirement in `shared-design-tokens` constrains the new text/surface pairs.
