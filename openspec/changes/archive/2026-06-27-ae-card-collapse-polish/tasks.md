## 1. Gradient-colored summary chips

- [x] 1.1 In `OperatorCard.tsx`, compute `const levelPs = getProgressStyle(operator.level, 1, 90)` and `const potentialPs = getProgressStyle(operator.potential, 0, 5)` in the component body (import `getProgressStyle` from `@/utils/progressGradient`).
- [x] 1.2 Pass `style={{ color: levelPs.color, borderColor: levelPs.borderColor }}` to the `Lv {level}` `StatChip` and `style={{ color: potentialPs.color, borderColor: potentialPs.borderColor }}` to the `P{potential}` `StatChip`.
- [x] 1.3 Leave the `rarity-indicator` span unchanged (no gradient — rarity is intrinsic).

## 2. Canonical level slider

- [x] 2.1 Change the level slider's `className` from `character-slider` to `level-slider`.
- [x] 2.2 Drive the thumb via inline custom properties: add `'--slider-fill-color': levelPs.color` and `'--slider-fill-glow': levelPs.glowColor` to the slider's `style`, and swap the track `linear-gradient`'s literal `var(--color-brand-primary)` for `levelPs.color`, keeping the existing `(level − 1) / 89 * 100` fill-percentage math.
- [x] 2.3 Confirm no other AE element references `.character-slider`; leave N2E's `.character-slider` rule and usages untouched.

## 3. Inline collapse height budgets

- [x] 3.1 Add `style={{ '--game-card-summary-max-height': '80px', '--game-card-edit-max-height': '<tuned>px' } as React.CSSProperties}` to the `.game-card` root element.
- [x] 3.2 Set `--game-card-edit-max-height` to 360px — safely above the computed edit-body content (~150–200px: Level section + Potential section incl. button-row wrap + gap/padding), so no clipping. Roster is auth-gated and jsdom can't measure layout, so live tuning is deferred to a manual glance (see 4.4); 360px can be tightened then.

## 4. Verify

- [x] 4.1 Update `OperatorCard.test.tsx` for the canonical `.level-slider` class / chip styling assertions if any reference the old markup. (Slider tests select via `getByRole('slider')`, not class — no change needed there. Added 5 new tests covering every spec scenario: level/potential chip gradient, slider fill via canonical class, no gear one-liner, rarity not gradient-colored.)
- [x] 4.2 Run `npm test` (OperatorCard + AE suites) and confirm green. (OperatorCard: 22/22; full AE folder: 82/82.)
- [x] 4.3 Run `npm run lint && npm run format:check` + `npm run build`. Changed files lint-clean (`npx eslint`) + Prettier-clean; full `npm run build` (tsc + vite) passes. NOTE: bare `npm run lint` exits non-zero, but only from gitignored `storybook-static/` build artifacts on disk — pre-existing, unrelated to this change, and never committed. The pre-push hook will trip on it until that stale dir is removed (`rm -rf storybook-static`).
- [x] 4.4 MANUAL: Visually confirmed in `npm run dev` (signed in): chips read rust→teal across investment, slider thumb tracks chip color, collapse/expand animates smoothly. 360px edit budget accepted (no visible overshoot reported).
