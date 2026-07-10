## Context

P5X revelation stat labels are stored as free-text strings, both in the static catalog (`SUB_STATS`, `MAIN_STATS` in `src/data/persona-5-phantom-x/revelations.ts`) and persisted verbatim in the DB:

- `p5x_revelation_cards.main_stat` (TEXT) — e.g. `Flat HP`, `Flat ATK & Flat DEF`.
- `p5x_revelation_cards.sub_stats` (JSONB, array of `{ type, value }`) — `type` holds the label.
- `p5x_revelation_preferences.stat` (TEXT) — substat preference chains store the label.

The `RevelationEditorModal` renders `<option>` values straight from the catalog pools, and the loaded card's stored `type`/`main_stat` must string-match an option to display as selected. Renaming a catalog label therefore orphans any existing row still holding the old label. The P5X revelation tables shipped 2026-07-10 (same-day migrations), so production data volume is expected to be near zero, but the migration is written to be correct regardless.

## Goals / Non-Goals

**Goals:**

- Flat P5X stat labels read `ATK` / `HP` / `DEF`, matching HSR and N2E.
- Existing DB rows are normalized so no saved selection is orphaned.
- Percent labels are untouched — `%` suffix remains the flat/percent discriminator.

**Non-Goals:**

- Reconciling the `ATK%` (P5X, no space) vs `ATK %` (N2E, spaced) percent-label styles.
- Any change to HSR/N2E stat labels — they already follow the target convention.
- Reworking the free-text storage model into an enum/lookup table.

## Decisions

**Rename map (single source of truth for both code and migration):**

| Old label             | New label   |
| --------------------- | ----------- |
| `Flat ATK`            | `ATK`       |
| `Flat DEF`            | `DEF`       |
| `Flat HP`             | `HP`        |
| `Flat ATK & Flat DEF` | `ATK & DEF` |

No new flat labels collide with an existing percent label (`ATK` vs `ATK%` stay distinct), so the rename is unambiguous and reversible.

**SPACE dual-stat handling.** `Flat ATK & Flat DEF` is one composite option, not two. Apply the rule to each half → `ATK & DEF`. It stays a single string; the modal treats it as one selectable option exactly as before.

**Migration approach — targeted string rewrites, not blanket replace.** Rewrite only the four known labels:

- `main_stat`: two `UPDATE ... WHERE main_stat = <old>` (for `Flat HP` and `Flat ATK & Flat DEF`).
- `preferences.stat`: `UPDATE ... WHERE stat = <old>` for the three flat substats.
- `sub_stats` (JSONB): map over the array rewriting each element's `type` when it matches a flat label, via a `jsonb_set`/`jsonb_agg` expression over `jsonb_array_elements`, updating only rows whose array contains a flat label.

Chosen over a naive `replace(col, 'Flat ', '')` because a blanket substring strip would corrupt any future label that legitimately contains the word "Flat" and is harder to reason about; explicit per-label rewrites match exactly the four strings we are retiring.

**No update script to touch.** `revelations.ts` is hand-maintained (memory: P5X manual seed; file carries no generated-banner), so the catalog edit is a direct source change — no `scripts/update-*` regeneration.

## Risks / Trade-offs

- **Migration runs after code deploy, leaving a brief window where the app expects new labels but rows still hold old ones** → the JSONB/text rewrites are idempotent and match only old labels; re-running is safe, and the same-day table age means near-zero affected rows. Ordering is not load-bearing because the modal simply shows an unmatched stored value as unselected until re-saved.
- **JSONB rewrite is the fiddliest part** → covered by verifying the migration against a seeded row locally; the unit tests assert the catalog labels, and the migration mirrors the exact rename map.
- **Rollback** → reverse the same four string rewrites (new → old); trivially scriptable if ever needed.
