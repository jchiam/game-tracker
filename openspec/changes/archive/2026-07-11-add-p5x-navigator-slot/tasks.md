## 1. Database

- [x] 1.1 Add migration `supabase/migrations/20260711000001_p5x_navigator_slot.sql`: drop + re-add `p5x_party_members_slot_index_check` as `slot_index >= 1 AND slot_index <= 7`. (Timestamp is `…0001`, not `…0000`, to avoid a version collision with the already-committed `20260711000000_p5x_rename_operator_column.sql`.)
- [x] 1.2 In the same migration, drop + re-add the `member_type` CHECK to `member_type IN ('thief', 'persona', 'navigator')`. The old inline-created constraint is dropped **name-agnostically** via a `pg_constraint` lookup (`DO` block) so the migration does not depend on the Postgres auto-naming convention — no live-DB name check required.

## 2. Service layer

- [x] 2.1 Update `partyService.ts` `memberToRow` to derive `member_type` by slot range: `slotIndex <= 3 ? 'persona' : slotIndex <= 6 ? 'thief' : 'navigator'`
- [x] 2.2 Update the `memberToRow` comment to describe the three slot ranges

## 3. Party editor config

> Config (predicates + slots + view) extracted from `PartiesTab.tsx` into a new
> `partyConfig.ts` so the component file exports only the component (avoids the
> react-refresh lint warning that exporting `P5X_SLOTS` from a component file
> would introduce). Behaviour is identical.

- [x] 3.1 Add predicates `isActiveThief = isThief && role !== 'Navigator'` and `isNavigator = isThief && role === 'Navigator'` (guard `role` access behind an `isThief` type guard) — in `partyConfig.ts`
- [x] 3.2 Narrow slots 4–6 `entityFilter` from `isThief` to `isActiveThief`
- [x] 3.3 Add slot `index: 7`, `label: 'Navigator'`, `entityFilter: isNavigator`, `searchPlaceholder: 'Search navigator...'`, `group: 'thieves'` — the Navigator shares the Phantom Thieves row as the 4th slot
- [x] 3.4 Keep the single `thieves` slot group for all 4 thief slots (no separate navigator group)

## 4. Styling

- [x] 4.1 Widen `.p5x-thief-panel` grid from 3 to 4 columns in `PartiesTab.css` so the 3 active thieves + Navigator sit in one row

## 5. Tests

- [x] 5.1 In `PartiesTab.test.tsx` assert slot 7 exists with label "Navigator" and its filter accepts a `role: 'Navigator'` thief and rejects a non-Navigator thief
- [x] 5.2 Assert slots 4–6 filters reject a `role: 'Navigator'` thief and accept a non-Navigator thief
- [x] 5.3 Extend `partyService.test.ts` to assert `memberToRow` maps slot 7 → `member_type: 'navigator'` (and 1–3 → persona, 4–6 → thief)

## 6. Verify

- [x] 6.1 Run `npx openspec validate --all` — passed (42 items)
- [x] 6.2 Run `npm run lint` (0 problems), `npm run build` (ok), `npm test` (1156 passed). Prettier clean on all touched files. NOTE: repo-wide `format:check` also flags two pre-existing unrelated files (`openspec/changes/archive/2026-07-11-p5x-revelation-summary-count/design.md`, `openspec/specs/p5x-thief-detail/spec.md`) not touched by this change.
