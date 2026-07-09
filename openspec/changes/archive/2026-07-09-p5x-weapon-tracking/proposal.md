## Why

P5X tracked Thieves have no weapon investment tracking. In-game, every Thief equips a character-specific weapon with three progression axes: **rarity** (2–5★), **level** (1–80, shared across all weapons on the same Thief), and **forge** (0–6, the dupe-based upgrade system). Weapons are a core investment dimension — especially forge, which consumes scarce duplicate weapons — but the tracker currently offers no way to record or compare weapon progress across your roster.

Unlike AE where weapons are type-shared (all Sword operators draw from the same pool), P5X weapons are character-locked — no weapon catalog or equip-by-name is needed. Three scalar fields on the tracked Thief are sufficient.

## What Changes

- Add three fields to the P5X tracked-thief model: `weaponRarity` (2–5, nullable — null means "not tracking yet"), `weaponLevel` (1–80, default 1), and `weaponForge` (0–6, default 0).
- Surface weapon investment on `ThiefCard`: a compact summary chip in collapsed mode (e.g. `⚔ 5★ F4`), and a weapon edit section with rarity `SegmentedButtons`, a `LevelSlider` (1–80), and forge `SegmentedButtons` (investment coloring) in edit mode.
- Weapon section stays inert (no chip, no edit section) until the user sets a `weaponRarity` — avoids cluttering cards for Thieves where the user hasn't started weapon tracking.
- New DB migration adds `weapon_rarity`, `weapon_level`, `weapon_forge` columns to `p5x_tracked_thieves` with appropriate `CHECK` constraints.
- Service column map, select string, insert defaults, and `fromRow` mapper extend to carry the three fields.
- Hook gains three field updaters via `makeFieldUpdater` (rarity, level, forge) — no custom coupling logic needed (unlike skills).
- No weapon catalog, no update-script changes, no party changes.

## Capabilities

### Modified Capabilities

- `p5x-thief-detail`: Adds weapon investment tracking (rarity, level, forge) with summary chip, edit controls, and DB persistence. Existing level / awareness / skills / mindscape / favorite / sort / search / card-composition requirements are unchanged.

## Impact

- **Schema:** new migration `supabase/migrations/YYYYMMDD000000_p5x_add_weapon_tracking.sql` — three columns on `p5x_tracked_thieves` with `CHECK` constraints.
- **Types:** `P5xTrackedThief` gains `weaponRarity`, `weaponLevel`, `weaponForge`; `P5xThiefPatch` gains matching optional fields.
- **Service:** `thiefService.ts` column map, `select`, `insertDefaults`, `fromRow` extend for the three columns.
- **Hook:** `useThieves.ts` gains three `makeFieldUpdater` calls + `createTrackedThief` defaults.
- **UI:** `ThiefCard.tsx` (+ `.css`) adds weapon summary chip and edit section (rarity segmented buttons, level slider, forge segmented buttons).
- **Tests:** `thiefService.test.ts` (wiring), `useThieves.test.ts` (updaters), `ThiefCard.test.tsx` (chip visibility + controls).
- **Docs:** delta spec on `p5x-thief-detail`.
- **Risk:** low — additive scalar fields over an established pattern; no catalog, no update-script, no party changes.
