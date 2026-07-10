## 1. Reorder hand-authored catalogs

- [x] 1.1 `src/data/persona-5-phantom-x/revelations.ts`: reorder `SUB_STATS` and each variable `MAIN_STATS` slot (MOON, STAR, SKY) to the taxonomy. SUN, SPACE unchanged.
- [x] 1.2 `src/data/honkai-star-rail/relics.ts`: reorder `SUB_STATS` and each variable `MAIN_STATS` slot (BODY, FEET, SPHERE, ROPE) to the taxonomy. HEAD, HANDS unchanged.

## 2. N2E generator + generated file

- [x] 2.1 `scripts/update-n2e-data.mjs`: add an explicit taxonomy-ordered array of N2E stat labels; sort emitted `CARTRIDGE_MAIN_STATS` / `CARTRIDGE_SUB_STATS` by index in it, appending any label not in the list (so a new stat lands last, not silently placed). Log a warning for unmatched.
- [x] 2.2 `src/data/neverness-to-everness/cartridge-stats.ts`: reorder both arrays to the deterministic result of 2.1's list filtered to present stats (reconcile committed file with the new generator, no pipeline run).

## 3. Enforcement test

- [x] 3.1 Add a test pinning each game's `SUB_STATS` and `MAIN_STATS` (per slot) to literal expected arrays — no classifier logic, just the arrays. Covers HSR, N2E, P5X.
- [x] 3.2 Extract the N2E ordering to importable `scripts/lib/statOrder.mjs` (`orderByList`, `unlistedStats`, `orderN2eStats`, `N2E_STAT_ORDER`) and unit-test it (`statOrder.test.mjs`) — including the unlisted-stat-appended-and-warned scenario. Add a `SubStatList` assertion that options render in given order (primitives apply no reordering).

## 4. Spec + docs

- [x] 4.1 `shared-ui-components`: add the Semantic stat-option ordering requirement (taxonomy + pools ordered in data, primitives render as-is, no runtime sort).
- [x] 4.2 `p5x-revelation-catalog`: update the main-pool and substat-pool requirement arrays to the new semantic order.
- [x] 4.3 `CONTEXT.md`: extend Stat-Label Fidelity → Stat Fidelity (labels + semantic order, single-sourced in the catalog arrays).

## 5. Validate

- [x] 5.1 `npm run lint && npm run format:check` clean.
- [x] 5.2 `npm test` — new pinning test green; existing HSR/N2E/P5X editor + catalog suites green (only sequence changed).
- [x] 5.3 `npm run build` (tsc + vite clean).
- [x] 5.4 `npx openspec validate --all`.
