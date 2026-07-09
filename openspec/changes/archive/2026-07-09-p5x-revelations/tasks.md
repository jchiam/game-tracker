## 1. Data Layer — Revelation Catalog

- [x] 1.1 Create `src/data/persona-5-phantom-x/revelations.ts` with interfaces (`EquippedRevelation`, `RevelationStat`, `RevelationSlot`, `HeavensSet`, `SpaceSet`) and static arrays (`ALL_HEAVENS_SETS`, `ALL_SPACE_SETS`, `MAIN_STATS`, `SUB_STATS`, `REVELATION_SLOTS`, `CARD_RARITIES`)
- [x] 1.2 Extend update script `scripts/update-p5x-data.mjs` to scrape Prydwen for revelation set data (or hardcode if scraping is unreliable)

## 2. Types

- [x] 2.1 Add `EquippedRevelation` and `RevelationStat` types to `src/types.ts` (or re-export from revelations.ts)
- [x] 2.2 Extend `P5xTrackedThief` with `revelations: { sun, moon, star, sky, space }` (each `EquippedRevelation | null`)
- [x] 2.3 Extend `P5xTrackedThief` with `revelationPreferences: { heavensSetId, spaceSetId, mainStats: { moon, star, sky }, subStats }`
- [x] 2.4 Extend `P5xThiefPatch` with revelation-related optional fields if needed for simple field updates

## 3. Database Schema

- [x] 3.1 Create migration: `p5x_revelation_cards` table (id UUID PK, thief_row_id FK CASCADE, slot TEXT CHECK, set_id TEXT, main_stat TEXT, sub_stats JSONB, UNIQUE(thief_row_id, slot)), RLS + index
- [x] 3.2 Create migration: `p5x_revelation_preferences` table (id UUID PK, thief_row_id FK CASCADE, category TEXT, stat TEXT, operator TEXT, order_index INTEGER), RLS + index

## 4. Service Layer

- [x] 4.1 Add `loadRevelations(thiefDbIds: string[])` to thiefService — bulk load all revelation card rows, return grouped by thief_row_id
- [x] 4.2 Add `upsertRevelationCard(thiefDbId, slot, data: EquippedRevelation)` — single upsert on (thief_row_id, slot)
- [x] 4.3 Add `deleteRevelationCard(thiefDbId, slot)` — delete row when slot cleared
- [x] 4.4 Add `loadRevelationPreferences(thiefDbIds: string[])` — bulk load preference rows, group by thief + category
- [x] 4.5 Add `saveRevelationPreferences(thiefDbId, preferences)` — delegate to shared `savePreferenceRows` pattern with category-based rows
- [x] 4.6 Write service tests (mock Supabase, test upsert/delete/load paths)

## 5. Hook Layer

- [x] 5.1 Extend `useThieves.ts` load path — after loading thieves, call `loadRevelations` and `loadRevelationPreferences`, merge into state
- [x] 5.2 Add `onUpdateRevelationSlot(id, slot, data | null)` updater — optimistic update + `queueAction` for upsert/delete
- [x] 5.3 Add `onSaveRevelationPreferences(id, preferences)` updater — optimistic update + `queueAction` for savePreferenceRows
- [x] 5.4 Write hook tests (hoisted mock pattern, verify load merge + optimistic updates)

## 6. UI — Summary Chip

- [x] 6.1 Add revelation summary chip to ThiefCard collapsed state — show Heavens set name + piece count, append Space set if present
- [x] 6.2 Color chip via `getProgressStyle` (progress = equipped Heavens count / 4)
- [x] 6.3 Place chip in correct dimension order: after Weapon, before Mindscape

## 7. UI — Edit Section

- [x] 7.1 Create `RevelationEditor` component — renders 5 slot editors (stacked vertically or tabbed)
- [x] 7.2 Per-slot editor: `Select` for set (Heavens catalog for slots 1-4, Space catalog for slot 5)
- [x] 7.3 Per-slot editor: `Select` for main stat (filtered by slot from MAIN_STATS; disabled for Sun/Space)
- [x] 7.4 Per-slot editor: `SubStatList` (stat-value variant, max 4, pool filtered to exclude main stat)
- [x] 7.5 Wire `RevelationEditor` into ThiefCard edit body between Weapon and Mindscape sections
- [x] 7.6 Add ThiefCard props for `onUpdateRevelationSlot`

## 8. UI — Preferences Section

- [x] 8.1 Add preferred Heavens set `Select` + preferred Space set `Select`
- [x] 8.2 Add `PreferenceChain` for Moon/Star/Sky main stats (stat options filtered per slot)
- [x] 8.3 Add `PreferenceChain` for substats (full SUB_STATS pool)
- [x] 8.4 Wire preference save callback through ThiefCard props

## 9. CSS

- [x] 9.1 Add revelation-specific styles to `ThiefCard.css` (slot editor layout, section spacing)
- [x] 9.2 Ensure design tokens cover any new colors needed (likely none — reuses investment gradient)

## 10. Testing

- [x] 10.1 Unit tests for RevelationEditor component (renders slots, filters stats, enforces limits)
- [x] 10.2 Integration: verify ThiefCard renders summary chip correctly with mock data
- [x] 10.3 Verify full add→equip→save round trip works via dev server
