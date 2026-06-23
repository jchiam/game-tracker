## Context

`resonanceCount` is threaded through five N2E layers (type → service → hook → page → card) plus a DB column and several test fixtures. It is dead weight: the cartridge score in `src/utils/cartridgeScoring.ts` ignores it, the catalog interface `N2ECharacter` does not define it, and `scripts/update-n2e-data.mjs` never references it. The only runtime effect is the "Resonance" slider and its color gradient on `CharacterCard`. Removal is a straight subtraction across the existing per-game module layers — no new patterns.

## Goals / Non-Goals

**Goals:**

- Remove `resonanceCount` from type, service, hook, page, and card.
- Drop the `resonance_count` column from `n2e_tracked_characters` via migration.
- Keep all other N2E tracked fields (level, awakening, arc, cartridge, preferences, favorite) untouched.
- Leave the test suite green with no orphaned references.

**Non-Goals:**

- No change to the cartridge scoring algorithm (it never used resonance).
- No change to the `awakening` mechanic (the legitimate 0–6 system stays).
- No backfill or data preservation — discarded values are intentional.
- No change to R1999's genuine `resonanceLevel`.

## Decisions

**1. Drop the column rather than leave it orphaned.**
A `DROP COLUMN` migration keeps the schema honest and matches the codebase convention of one timestamped migration per schema change. Alternative — leaving the column and only removing app references — was rejected: it leaves a misleading column and the column has `NOT NULL DEFAULT 0`, so it harms nothing to remove and avoids future confusion. Migration filename follows convention: `YYYYMMDD000000_drop_n2e_resonance_count.sql` dated after the latest existing migration.

**2. Full vertical removal in one change.**
Because the field is unused by scoring and parties, there is no phased deprecation. Remove it everywhere in one pass so no layer references a field another layer dropped. Order: type first (compiler surfaces every consumer), then service/hook/page/card, then migration, then tests.

**3. Use the TypeScript compiler as the find-list.**
After deleting the field from `N2ETrackedCharacter` and `N2ECharacterPatch`, `npm run build` (tsc) will flag every remaining reference. This is the authoritative checklist; the Impact list in the proposal is the expected set.

## Risks / Trade-offs

- **Migration is destructive (drops stored values)** → Accepted by design; no feature depends on the data. Rollback is re-adding the column with its original `INTEGER NOT NULL DEFAULT 0`, which restores schema but not values (acceptable — values carried no meaning).
- **Missed reference leaves a type error or dead UI** → Mitigated by tsc build + `npm test`; the build will not pass with a dangling `resonanceCount`/`onUpdateResonance`.
- **Migration ordering on a deployed DB** → The column is `NOT NULL DEFAULT 0`, so `DROP COLUMN` is unconditional and safe regardless of existing rows.

## Migration Plan

1. Apply code removal across type/service/hook/page/card + tests.
2. Add and apply migration dropping `resonance_count`.
3. Verify `npm run lint && npm run format:check && npm test && npm run build` pass.
4. Rollback (if needed): revert the code commit and re-add the column via a follow-up migration (`ADD COLUMN resonance_count INTEGER NOT NULL DEFAULT 0`).
