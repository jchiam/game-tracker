## Why

The P5X Revelation set catalog in `src/data/persona-5-phantom-x/revelations.ts` is a hand-seeded **subset** of the real game data: 12 of 26 Heavens sets and 8 of 16 Space sets (~20 of ~42 total). Sets that exist in-game — including **Labor** (Heavens) and **Integrity** (Space) — are absent from `ALL_HEAVENS_SETS` / `ALL_SPACE_SETS`, so a user who owns those cards cannot select them in the Revelation editor. Unlike thieves and personas (scraped weekly from Prydwen), the set catalog has no update pipeline, so it silently drifts stale.

## What Changes

- Expand `ALL_HEAVENS_SETS` from 12 to the full 26 canonical Heavens sets (each with `id`, `name`, `twoSetEffect`, `fourSetEffect`), preserving alphabetical order by `name`.
- Expand `ALL_SPACE_SETS` from 8 to the full 16 canonical Space sets (each with `id`, `name`, `effect`), preserving alphabetical order by `name`.
- Pin **Game8 — List of All Revelation Cards** as the canonical alignment source in the file header comment (replacing the vague "Prydwen/Fragster" provenance), noting the catalog is manually maintained (no scraper).
- Correct the `p5x-revelation-catalog` spec's stale example set names (currently lists fictional names — "Abundance", "Science", … — that match neither the game nor the current data) to the real canonical names, and raise the "at least N" counts.

The 20 existing sets keep their current `id`s (no renames, no removals, no id churn). The 12 existing Heavens entries are unchanged. The 8 existing **Space** entries have their `effect` prose normalized to the same factual "Paired bonuses with X sets" style as the new Space entries — Space bonuses are pairing-conditional (no standalone one-liner), so the prior standalone strings were an inaccurate model; ids stay stable and this metadata field is unrendered.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `p5x-revelation-catalog`: the **Heavens set catalog** and **Space set catalog** requirements change — the catalog SHALL contain the full canonical set list (26 Heavens, 16 Space), and the enumerated example/count in each requirement's scenarios is corrected to the real set names.

## Impact

- **Data:** `src/data/persona-5-phantom-x/revelations.ts` — `ALL_HEAVENS_SETS`, `ALL_SPACE_SETS`, header comment.
- **Spec:** `openspec/specs/p5x-revelation-catalog/spec.md` (via delta).
- **No DB migration.** Sets are a static catalog referenced by `id` string on `EquippedRevelation.setId` / preference rows; adding entries is backward-compatible. The unknown-set fallback (`ALL_*.find(...)?.name ?? id`) already tolerates ids not in the array, so pre-existing saved rows are unaffected and simply gain proper display names.
- **Tests:** `revelations.test.ts` asserts no Heavens/Space count, so existing tests stay green; new assertions for the fuller catalog are added under this change.
- **Source accuracy:** effect text for the 22 new sets MUST be verified against Game8 per-set pages during apply — not lifted from a summarizer.
