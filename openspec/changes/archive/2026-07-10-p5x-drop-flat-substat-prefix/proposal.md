## Why

Persona 5X revelation stat labels prefix flat values with "Flat" (`Flat ATK`, `Flat HP`, `Flat DEF`) while percent values use a bare `%` suffix (`ATK%`). Every other game uses bare stat names for flat values (HSR `ATK`/`HP`/`DEF`, N2E `ATK`/`HP`/`DEF`) and only marks the percent variant. The "Flat" prefix is redundant — the absence of `%` already means flat — and makes P5X inconsistent with the rest of the roster.

## What Changes

- Drop the `Flat ` prefix from every P5X flat stat label so flat values read `ATK` / `HP` / `DEF`.
  - `SUB_STATS`: `Flat ATK` → `ATK`, `Flat DEF` → `DEF`, `Flat HP` → `HP`.
  - `MAIN_STATS.SUN`: `Flat HP` → `HP`.
  - `MAIN_STATS.SPACE`: `Flat ATK & Flat DEF` → `ATK & DEF`.
- Percent labels are unchanged — the `%` suffix stays as the sole flat/percent discriminator.
- **BREAKING (data):** these labels are persisted as free-text in `p5x_revelation_cards.main_stat` / `sub_stats` (JSONB) and `p5x_revelation_preferences.stat`. A one-shot normalization migration rewrites existing rows from the old labels to the new ones so saved selections keep matching the option pool.
- Update tests and the design-system stat pool references that assert the old labels.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-revelation-catalog`: the `MAIN_STATS` per-slot pool and `SUB_STATS` pool requirements change to drop the `Flat` prefix from flat stat labels.

## Impact

- **Data:** `src/data/persona-5-phantom-x/revelations.ts` (`SUB_STATS`, `MAIN_STATS`). Hand-maintained (no update script), so edited directly.
- **DB migration:** new `supabase/migrations/` file normalizing `p5x_revelation_cards.main_stat`, `p5x_revelation_cards.sub_stats` (JSONB `type` fields), and `p5x_revelation_preferences.stat`.
- **Tests:** `ThiefCard.test.tsx`, `RevelationEditorModal.test.tsx`, and any P5X test asserting `Flat ATK`/`Flat HP`/`Flat ATK & Flat DEF`.
- **Spec:** `openspec/specs/p5x-revelation-catalog/spec.md`.
- **Non-goal:** the `ATK%` (no space) vs N2E `ATK %` (spaced) percent-label mismatch is out of scope.
