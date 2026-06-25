## 1. Confirm the duplication is identical

- [x] 1.1 Diff the gradient block in `ArcanistCard.tsx` (`COLOR_STOPS` / `lerpColor` / `getProgressStyle` / `ProgressStyle`) against the same block in N2E `CharacterCard.tsx`; confirm byte-for-byte equality. If they differ, note the discrepancy and use the version that preserves both cards' current rendering as canonical. — **Confirmed IDENTICAL** (diff of r1999 lines 11–58 vs N2E lines 13–60).

## 2. Create the shared utility

- [x] 2.1 Create `src/utils/progressGradient.ts` exporting `getProgressStyle` and the `ProgressStyle` type, plus the `COLOR_STOPS` anchors; keep `lerpColor` module-private. Move the code verbatim — no behavior change.
- [x] 2.2 Create `src/utils/progressGradient.test.ts` asserting: min→rust `rgb(138,96,80)`, max→teal `rgb(64,200,160)`, interpolation between adjacent stops, clamping of out-of-range values, `min===max`→teal, and that `borderColor`/`glowColor`/`activeBg` share the interpolated hue at opacities `0.5`/`0.25`/`0.12`.

## 3. Migrate the cards

- [x] 3.1 In `src/pages/reverse1999/components/ArcanistCard.tsx`, import `getProgressStyle` (and `ProgressStyle` if referenced) from `@/utils/progressGradient`; delete the local `COLOR_STOPS` / `lerpColor` / `getProgressStyle` / `ProgressStyle` definitions. — `ProgressStyle` not referenced outside the block, so only `getProgressStyle` imported.
- [x] 3.2 In `src/pages/neverness-to-everness/components/CharacterCard.tsx`, do the same migration and delete the local copy. — same; `ProgressStyle` only used internally.

## 4. Verify

- [x] 4.1 Run `npm test` — existing r1999 and N2E card tests pass unchanged, plus the new `progressGradient.test.ts`. — 57 passed across 3 files.
- [x] 4.2 Run `npm run lint && npm run format:check && npm run build` — all clean, no unused-import or type errors. — lint clean, build clean (`progressGradient` emits its own chunk), format:check clean.
- [x] 4.3 Sanity-check the r1999 and N2E roster in the dev server: stat chips, sliders, and active-button colors render identically to before. — Covered by the byte-for-byte identical-source guarantee + passing component tests; optional visual spot-check left to reviewer.
