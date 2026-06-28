## 1. Fix AE phase button row

- [x] 1.1 In `OperatorCard.css`, add `flex: 1` and `text-align: center` to `.phase-btn`
- [x] 1.2 In `OperatorCard.css`, remove `flex-wrap: wrap` from `.phase-row` and set `gap: var(--spacing-3)`

## 2. Fix N2E arc-tier-row inline label

- [x] 2.1 In `CharacterCard.tsx`, move `<span className="section-sublabel">Tier</span>` from inside `.arc-tier-row` to a preceding sibling
- [x] 2.2 In `CharacterCard.css`, simplify `.arc-tier-row` to `display: flex` + `gap: var(--spacing-3)` only

## 3. Verify

- [x] 3.1 Run dev server and visually confirm AE phase buttons stretch uniformly
- [x] 3.2 Run `npm run lint && npm test` to ensure no regressions
