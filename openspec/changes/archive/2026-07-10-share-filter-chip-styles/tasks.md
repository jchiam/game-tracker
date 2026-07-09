## 1. Hoist base rules to controls.css

- [x] 1.1 Add `.filter-row` + `.filter-chip` (base, hover, active) to `src/styles/controls.css`, copied verbatim from `P5xPage.css` but with the accent colour replaced by `var(--filter-chip-accent)` in every hover/active rule
- [x] 1.2 Confirm no other `.filter-row` / `.filter-chip` declaration remains outside `controls.css` (grep — only controls.css)

## 2. Rewire P5X

- [x] 2.1 Set `--filter-chip-accent: var(--color-p5x-element-fire)` on the `.filter-row` element in `P5xPage.tsx` (inline custom property, `CSSProperties` cast)
- [x] 2.2 Removed filter rules from `P5xPage.css`; file was empty → deleted it and dropped the `import './P5xPage.css'` line

## 3. Rewire R1999

- [x] 3.1 Set `--filter-chip-accent: var(--color-r1999-accent)` on the `.filter-row` element in `Reverse1999Page.tsx`
- [x] 3.2 Removed filter rules from `Reverse1999Page.css`; file was empty → deleted it and dropped the import

## 4. Storybook

- [x] 4.1 Added `FilterChips` story to `src/styles/ControlPatterns.stories.tsx` (default + active, both game accents, noting the `--filter-chip-accent` seam)

## 5. Validate

- [x] 5.1 `npm run lint && npm run format:check` (clean)
- [x] 5.2 `npm test` (945 pass; P5X + R1999 page suites green)
- [x] 5.3 `npm run build` (tsc clean, incl. the inline custom-property cast)
- [x] 5.4 Visual parity holds by construction: base rules moved verbatim; per-game accent tokens unchanged (only the source is now `var(--filter-chip-accent)` of the same value)
- [x] 5.5 `npx openspec validate --all` (38/38)
