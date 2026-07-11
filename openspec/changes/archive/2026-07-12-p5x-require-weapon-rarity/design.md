## Context

`weaponRarity` was introduced (change `p5x-weapon-tracking`) as a **nullable** field: `null` on add, set via a `SegmentedButtons` with `allowDeselect` (deselect → `null`), and `null` meaning "weapon investment not yet tracked". The DB column `p5x_tracked_thieves.weapon_rarity` is `SMALLINT CHECK (weapon_rarity BETWEEN 2 AND 5)` with no `DEFAULT` and no `NOT NULL`, so it defaults to `null`. The card hides the weapon chip and shows "—" when `null`.

In the game, every thief comes with the lowest-tier (2★) weapon equipped for free. So `null` never corresponds to a real in-game state — it is only a tracking artifact, and it contradicts the game model.

## Goals / Non-Goals

**Goals:**

- Make "a thief always has a weapon of rarity 2–5" a structural invariant, not a convention.
- Default new tracked thieves to `2★`.
- Remove the `null`/"—"/clearable states from model, UI, and DB.

**Non-Goals:**

- No change to weapon level or forge (still 1 and 0 defaults).
- No new weapon catalog or per-weapon identity — rarity remains a free per-thief integer.
- No filter work — that is the separate `p5x-weak-weapon-filter` change.

## Decisions

**`weaponRarity: number | null` → `number`.** The type narrows at the source (`P5xTrackedThief` in `types.ts`), which makes every existing `weaponRarity !== null` guard in `ThiefCard` dead and forces `onUpdateWeaponRarity` to `(id: string, value: number)`. This is the mechanism that makes the invariant real: illegal states become unrepresentable rather than merely defaulted-away. Alternative — keep the type nullable but "default to 2 and hope" — rejected: it leaves `allowDeselect` producing `null` again and keeps the contradictory branch alive.

**Backfill existing `null` rows to `2`.** A one-way data mutation in the migration: `UPDATE p5x_tracked_thieves SET weapon_rarity = 2 WHERE weapon_rarity IS NULL`, then `SET DEFAULT 2` and `SET NOT NULL`. Rationale: under the day-one rule, a previously-untracked (`null`) weapon was always an unacknowledged 2★, so `2` is the faithful reinterpretation. The existing `CHECK (… BETWEEN 2 AND 5)` already forbids values outside the target set, so no CHECK change is needed. User approved the backfill.

**Remove `allowDeselect` rather than intercept the clear.** Dropping the prop is simpler than keeping it and coercing a deselect back to the previous value, and it matches the new "cannot be cleared" requirement directly.

## Risks / Trade-offs

- **Backfill rewrites user data** → Accepted and approved; it is the correct reinterpretation, and the CHECK guarantees no out-of-range value results.
- **Type narrowing ripples through tests** → Expected; the diff is mechanical (delete null branches). Covered by updating `ThiefCard`/`useThieves`/`thiefService` tests.
- **Migration not transactional with deploy** → The migration is backward-safe: old app code tolerates a non-null `weapon_rarity` (it already reads `?? null`), so ordering is not fragile.

## Migration Plan

1. Add `supabase/migrations/20260712000000_p5x_weapon_rarity_not_null.sql`: `UPDATE … SET weapon_rarity = 2 WHERE weapon_rarity IS NULL;` then `ALTER TABLE p5x_tracked_thieves ALTER COLUMN weapon_rarity SET DEFAULT 2, ALTER COLUMN weapon_rarity SET NOT NULL;`. (Pick the timestamp with `ls supabase/migrations/ | tail` — latest is `20260711000001`, so `20260712000000` is safe and unique.)
2. Ship the type + code + test changes together.
3. Rollback: `ALTER COLUMN … DROP NOT NULL, DROP DEFAULT` restores nullability; app code reverts independently.

## Open Questions

None — default (`2`), backfill, and `allowDeselect` removal are all decided.
