## 1. Catalog — slot order + summary helper

- [x] 1.1 `revelations.ts`: reorder `REVELATION_SLOTS` to `['space', 'sun', 'moon', 'star', 'sky']` (leave `HEAVENS_SLOTS` unchanged).
- [x] 1.2 `revelations.ts`: add `RevelationSetBonus` / `RevelationSummary` types and `getRevelationSummary(revelations)` — group Heavens by set (≥2 → 2pc, ==4 → 4pc, singles omitted; 4pc before 2pc, then name), resolve the Space set; returns `{ spaceSet, heavensBonuses }`.

## 2. Card rendering

- [x] 2.1 `ThiefCard.tsx`: replace the dominant-only chip logic with `getRevelationSummary`; render the consolidated summary chip space-first, dot-joined (`Meditation · Power 2pc · Peace 2pc`), shown when non-empty, colored via investment gradient (best Heavens bonus).
- [x] 2.2 `ThiefCard.tsx`: in the Revelations `ProgressSection`, render a space-first per-set readout list (Space tagged `(Space)`; each Heavens bonus `{name} {pieces}pc`) in the section body above the Edit button; `value` = the same one-liner or `—`.
- [x] 2.3 `ThiefCard.css`: style the readout list.

## 3. Tests

- [x] 3.1 `revelations.test.ts`: `getRevelationSummary` — 4pc, 2pc+2pc (both shown), 3-card set = 2pc, single-card set omitted, space-only, ordering (space first; 4pc before 2pc); plus `REVELATION_SLOTS` space-first order.
- [x] 3.2 `ThiefCard.test.tsx`: update revelation-chip expectations to consolidated space-first output; add edit-readout list coverage.
- [x] 3.3 Cover the edit empty-state (`value` `—`, no `.rev-set-readout`) in `ThiefCard.test.tsx` and assert `HEAVENS_SLOTS` unchanged in `revelations.test.ts` (verify-pass suggestions).

## 4. Spec

- [x] 4.1 `p5x-revelation-catalog`: MODIFY the slot-identifiers requirement — `REVELATION_SLOTS` space-first; Space first, Heavens the remaining four.
- [x] 4.2 `p5x-thief-detail`: MODIFY the collapsed-summary requirement (consolidated space-first revelation chip) and ADD a consolidated set readout requirement for the edit Revelations section, both via `getRevelationSummary`.

## 5. Validate

- [x] 5.1 `npm run lint && npm run format:check` clean.
- [x] 5.2 `npm test` — new + updated P5X suites green.
- [x] 5.3 `npm run build` clean.
- [x] 5.4 `npx openspec validate --all`.
