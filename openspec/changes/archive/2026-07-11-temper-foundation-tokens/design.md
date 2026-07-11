## Context

The Temper design language was approved from the mockup artifact (2026-07-11). Its adoption map splits work into three changes; this is the first — the L1 token foundation. Current state: neutrals are cool "dark cosmic" greys (`#0a0a0f` ground, `#f0f0f5` text), the body face is Inter loaded from Google Fonts (the app's only external font dependency), and the four investment-gradient anchors exist as literals in two places (`color.score.grade*` tokens and `progressGradient.ts` `COLOR_STOPS`) without a canonical named token group.

Constraints: `shared-design-tokens` requires WCAG AA (≥ 4.5:1) for all three text tokens on all four surfaces; `shared-progress-gradient` pins the anchor hex values — this change must not alter them; `tokens.css` is generated (`npm run build:tokens`).

## Goals / Non-Goals

**Goals:**

- Warm neutrals (Ink / Slate / Porcelain) as token value changes only — no token renames, so no CSS churn.
- `color.temper.*` as the canonical anchor group; grade tokens become references.
- Three system-native font roles (display / base / data); zero external font loading.
- Apply the roles at global-chrome level (headings, card names, section labels, numerals).

**Non-Goals:**

- ScoreBadge temper-rail redesign (change 2), GameCardShell anodized edge (change 3).
- Any change to gradient anchor values, `progressGradient.ts`, scoring logic, or component structure.
- Per-game accent palettes (`color.hsr` etc.) — game hues stay outside the temper ramp by design.
- Light theme. Temper is single-theme dark by intent.

## Decisions

### D1: Re-point neutral token values; keep token names

New values (old → new):

| Token                   | Old                  | New                                   |
| ----------------------- | -------------------- | ------------------------------------- |
| `color.bg.base`         | `#0a0a0f`            | `#0e1014` (Ink)                       |
| `color.bg.surface`      | `rgba(25,25,35,0.7)` | `rgba(26,30,38,0.7)` (Slate glass)    |
| `color.bg.surfaceHover` | `rgba(40,40,55,0.8)` | `rgba(38,44,56,0.8)`                  |
| `color.bg.elevated`     | `rgba(30,30,42,0.9)` | `rgba(30,35,45,0.9)`                  |
| `color.text.primary`    | `#f0f0f5`            | `#e9e4d8` (Porcelain)                 |
| `color.text.secondary`  | `#a0a0b5`            | `#b3ad9e` (warm Porcelain derivative) |
| `color.text.dim`        | `#8a8aa0`            | `#9a9484` (warm Porcelain derivative) |

Renaming to `--color-ink` etc. was rejected: every stylesheet already references the semantic `bg`/`text` names, and the AA requirement is written against those names. Values-only keeps the diff to one JSON file plus regeneration. The secondary/dim values are starting points — the implementation task verifies computed AA ratios against all four surfaces (composited over Ink) and nudges lightness if any pair lands under 4.5:1.

### D2: `color.temper.*` anchors; grade tokens reference them

```json
"temper": {
  "rust":      { "$value": "#8a6050" },
  "amber":     { "$value": "#c88040" },
  "gold":      { "$value": "#d4af37" },
  "verdigris": { "$value": "#40c8a0" }
}
```

`color.score.gradeS/A/B/D` become Style Dictionary references (`{color.temper.verdigris}` / `gold` / `amber` / `rust`); `gradeC` stays literal `#b48c64` (a ramp midpoint, not an anchor). `brand.primary` also becomes `{color.temper.gold}` — same value today, now provably the same colour. `progressGradient.ts` `COLOR_STOPS` stays as-is (runtime interpolation needs numeric rgb; values already match the spec'd anchors) — a comment pointing at the temper tokens is added so the two homes stay linked.

Alternative considered: single source with tokens feeding the TS module via codegen — rejected as over-engineering for four constants already locked by `shared-progress-gradient` scenarios.

### D3: System-native font stacks

```json
"fontFamily": {
  "display": { "$value": "'Bahnschrift', 'Avenir Next Condensed', 'Arial Narrow', system-ui, sans-serif" },
  "base":    { "$value": "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif" },
  "data":    { "$value": "'Cascadia Mono', Consolas, 'SF Mono', 'Menlo', monospace" }
}
```

Bahnschrift (DIN 1451 heir) ships with Windows 10+; Avenir Next Condensed covers macOS with a similar condensed-grotesque voice; Arial Narrow is the broad fallback. Cascadia Mono ships with Windows 11 / Windows Terminal; Consolas and SF Mono cover the rest. No `@font-face`, no data URIs, no CDN — deleting the Inter `@import` removes the app's only render-blocking external stylesheet and lets CSP drop two hosts.

### D4: Role application lives in shared CSS, not per-component sweeps

- `index.css`: heading elements + `.selection-title`-class page titles get `--typography-font-family-display`; body keeps `base`.
- `card.css`: `.game-card-name`, `.section-header` get display face (with slight `letter-spacing` on the uppercase labels).
- `controls.css` / `ScoreBadge.css`: `.level-value`, `.stat-chip` (whole chip — `StatChip` renders a single span, there is no separate value span), `.score-badge` get `--typography-font-family-data` + `font-variant-numeric: tabular-nums`.

Game CSS files are not touched; canonical class names mean the shared rules reach every game.

## Risks / Trade-offs

- [Bahnschrift absent on non-Windows] → condensed fallbacks are metric-similar; the stack degrades to system-ui, never to a serif. Visual QA note in tasks.
- [Segoe UI vs Inter metrics shift measured collapse heights in GameCardShell] → heights are measured at runtime, self-adjusting; no hardcoded budgets exist.
- [New secondary/dim values fail AA on some surface] → task includes a computed-contrast check; values are adjustable derivatives, not brand-locked.
- [App-wide hue shift lands in one commit] → intentionally so — half-migrated neutrals would look broken; rollback is a single revert + `npm run build:tokens`.
- [`verify:csp` scope] → the script checks Supabase `connect-src`; the font-host removal is verified by the script still passing plus a manual grep that no `fonts.` host remains in `vercel.json`.

## Migration Plan

1. Token edits + `npm run build:tokens`.
2. `index.css` import removal + role application; shared CSS role hookup.
3. `vercel.json` CSP cleanup; `npm run verify:csp`.
4. Storybook updates; full test suite.

Rollback: revert the commit, rerun `npm run build:tokens`.

## Open Questions

None — palette, stacks, and application surfaces were fixed by the approved mockup.
