## 1. Shared primitives — id/label options

- [x] 1.1 `SubStatList.tsx`: widen `options` to `readonly (string | { value, label })[]`; add
      a local `normalizeOption` (bare string → `{ value: s, label: s }`); render `label`,
      emit `value`; make `excludeValues` and any current-value comparison operate on `value`.
- [x] 1.2 `PreferenceChain.tsx` (stat-chain mode): widen `options` to
      `readonly (string | { value, label })[]`; normalize like 1.1; the appended default stat
      uses the first option's `value`; render labels, persist values.
- [x] 1.3 Confirm HSR relic + N2E cartridge editors still compile passing `string[]` (no call
      site change) and behave identically (value === label).
- [x] 1.4 Update `SubStatList.stories.tsx` and `PreferenceChain.stories.tsx` with a
      distinct-value/label variant.
- [x] 1.5 Extend/adjust `SubStatList.test.tsx` and `PreferenceChain.test.tsx`: string options
      still value===label; `{value,label}` options show label, emit value.

## 2. P5X catalog — id/label decouple + corrected labels

- [x] 2.1 `revelations.ts`: add `STAT_LABELS: Record<string, string>` with the 14 pinned
      id → in-game-label entries (no `Attack Mult.` — not a card substat).
- [x] 2.2 Rewrite `MAIN_STATS` per-slot pools and `SUB_STATS` as id arrays (per proposal).
- [x] 2.3 Add `toStatOptions(ids): { value, label }[]` resolving via `STAT_LABELS`.
- [x] 2.4 Update `p5x-revelation-catalog` catalog tests to the id pools + label map; assert no
      label contains guide shorthand (`Multiplier`, `DMG`, `Accuracy`, `ATK`, `DEF`).

## 3. P5X editor + card wiring

- [x] 3.1 `RevelationEditorModal.tsx` (Equip tab): feed `Select` main-stat options and
      `SubStatList` options via `toStatOptions(...)`; `excludeValues` uses the equipped main
      **id**; stored `mainStat` / `subStats[].type` are ids.
- [x] 3.1a Space slot: render its **two** fixed mains (`Attack`, `Defense`) as read-only rows
      (generalise the current single-fixed-main path, `MAIN_STATS[slot].length > 1` → all fixed);
      keep `mainStat` `null` for Space; `excludeValues` for its substats excludes both `attack`
      and `defense`.
- [x] 3.2 `RevelationEditorModal.tsx` (Preferences tab): main-stat + substat `PreferenceChain`
      options via `toStatOptions(...)`; persisted `stat` values are ids.
- [x] 3.3 `ThiefCard.tsx`: verify the summary renders no raw stat label; if it does, resolve
      via `STAT_LABELS[id] ?? id`. (Current summary shows set names only — expected no-op.)
- [x] 3.4 Update `RevelationEditorModal.test.tsx` / `ThiefCard.test.tsx` fixtures to id values.

## 4. DB backfill migration

- [x] 4.1 Add `supabase/migrations/20260710000003_p5x_stat_label_ids.sql`: rewrite `main_stat` (TEXT) and each `sub_stats[].type` (JSONB) old→new per the map; set Space `main_stat` to NULL; rewrite `p5x_revelation_preferences.stat` old→new only for categories `moon_main`/`star_main`/`sky_main`/`sub_stats` (leave `heavens_set`/`space_set`). Idempotent, matching the prior `drop_flat_stat_prefix` migration's style.
- [x] 4.2 Load-time safety net: `statLabel(id) = STAT_LABELS[id] ?? id` keeps an unmigrated/unknown id visible rather than blank on every display surface.

## 5. Standardisation rule

- [x] 5.1 Add the stat-label-fidelity rule to `CONTEXT.md` (verbatim in-game labels per game;
      ids decoupled from labels in storage; single-sourced in `data/{game}/*.ts`).

## 6. Validate

- [x] 6.1 `npm run lint && npm run format:check` clean.
- [x] 6.2 `npm test` — P5X revelation suites green on id/label; HSR + N2E editor suites green.
- [x] 6.3 `npm run build` (tsc clean, incl. widened option unions).
- [x] 6.4 Migration `20260710000003` synced to Supabase; spot-query confirmed no old-string
      values remain in `main_stat`, `sub_stats[].type`, or main/sub-category preference `stat`.
- [x] 6.5 `npx openspec validate --all`.
