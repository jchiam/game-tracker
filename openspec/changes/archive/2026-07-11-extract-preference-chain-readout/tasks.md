## 1. Shared component

- [x] 1.1 Create `src/components/PreferenceChainReadout.tsx`: props `{ label: string; chain: StatPreference[]; formatStat?: (stat: string) => string }`; renders `.pref-display-row` → `.pref-display-label` + `.pref-display-chain` of `.pref-stat-badge` (+ `.pref-operator-badge` with `>=` → `≥`); returns `null` for empty chain. No own CSS (uses `card.css`).
- [x] 1.2 Add `PreferenceChainReadout.test.tsx`: operators rendered with glyph mapping, no operator badge on operator-less entry, `formatStat` resolution, empty chain renders nothing.
- [x] 1.3 Add `PreferenceChainReadout.stories.tsx` (L3 rule): chain with operators, id-vocabulary chain with `formatStat`, single-entry chain; Controls wired.

## 2. Card adoption

- [x] 2.1 HSR `CharacterCard.tsx`: replace the four variable-slot rows and the Subs row with `PreferenceChainReadout` (slot label capitalized; empty-chain guard drops — component handles it).
- [x] 2.2 N2E `CharacterCard.tsx`: replace the Main and Subs rows.
- [x] 2.3 P5X `ThiefCard.tsx`: replace the Moon/Star/Sky rows and the Subs row, passing `formatStat={statLabel}`.
- [x] 2.4 Update CLAUDE.md L3 shared-components table with a `PreferenceChainReadout` row.

## 3. Verify

- [x] 3.1 `npm test` — three card suites pass unchanged (markup byte-identical).
- [x] 3.2 `npm run lint && npm run format:check && npm run build`.
- [x] 3.3 `npx openspec validate --all`.
