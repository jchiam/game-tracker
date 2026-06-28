## Context

AE's `OperatorCard.css` defines `.phase-btn` without `flex: 1` and `.phase-row` with `flex-wrap: wrap`. Buttons size to content width, producing unequal widths. R1999's `.portrait-row` uses shared `.toggle-btn` (which has `flex: 1`) and no wrapping.

Separately, N2E's `CharacterCard.tsx` places an inline sublabel inside `.arc-tier-row`, stealing flex space from buttons.

## Goals / Non-Goals

**Goals:**

- Uniform horizontal stretching of AE phase buttons (match R1999 portrait-row pattern)
- Also fix N2E arc-tier-row inline label for consistency

**Non-Goals:**

- Migrating AE `.phase-btn` to shared `.toggle-btn` class (too many style differences)
- Changing button count or value range
- Changing R1999 or HSR card layouts

## Decisions

**Add `flex: 1` to `.phase-btn` rather than switching to `.toggle-btn` class.**
AE's phase buttons have distinct styling (active state fills all buttons up to current value, different colours). Switching class would require overriding too many shared styles. Just adding `flex: 1` + `text-align: center` achieves uniform width with minimal change.

**Remove `flex-wrap: wrap` from `.phase-row`.**
6 buttons (P0–P5) fit comfortably on a single row at card width. Wrapping prevented uniform stretch since buttons could break to a second line.

**Standardise gap to `var(--spacing-3)`.**
Matches R1999's `.portrait-row` gap exactly.

## Risks / Trade-offs

- [Narrow cards] → On extremely narrow viewports, 6 buttons without wrapping could overflow. Acceptable — cards have a minimum width that accommodates 6 buttons.
