## Context

`ALL_HEAVENS_SETS` (12) and `ALL_SPACE_SETS` (8) in `src/data/persona-5-phantom-x/revelations.ts` were seeded by hand when the P5X module landed. The game actually ships ~26 Heavens and ~16 Space sets (per Game8's "List of All Revelation Cards"). The P5X update pipeline (`scripts/update-p5x-data.mjs`) scrapes only thieves and personas from Prydwen's Gatsby page-data — Prydwen's `/cards` page renders client-side and exposes no page-data JSON (verified: empty `pageContext`), so there is no automated path for sets. The catalog therefore drifts stale silently. Sets are static reference data keyed by `id`; consumers resolve a name via `ALL_*.find(s => s.id === id)?.name ?? id`, and equipped/preference rows persist only the `id` string.

## Goals / Non-Goals

**Goals:**

- `ALL_HEAVENS_SETS` and `ALL_SPACE_SETS` contain the full canonical set list, so every in-game set (incl. Labor, Integrity) is selectable.
- Effect text for each new set verified against Game8 per-set pages, matching the existing terse summary style (e.g. `"12% attack"`), not verbatim tooltip prose.
- Game8 pinned as the canonical alignment source in the file header; provenance no longer vague.
- The `p5x-revelation-catalog` spec's stale/fictional example set names corrected.

**Non-Goals:**

- No scraper/automation for sets — the catalog stays manually maintained (matches the original seed; sets change rarely). A future automation is out of scope.
- No change to set-bonus mechanics, `getRevelationSummary`, main/sub stat pools, slots, or rarities.
- No `id` renames or removals of the 20 existing sets; no DB migration.

## Decisions

**Canonical source = Game8 "List of All Revelation Cards"** (`game8.co/games/Persona-5-Phantom-X/archives/532937`) plus its per-set pages. Chosen over Prydwen (no scrapeable JSON for cards; incomplete) and Fragster/Lufelnet (less structured). Game8 has one page per set with 2pc/4pc effects and a Heavens/Space taxonomy that already matches our 20 existing sets exactly. _Alternative — Prydwen for consistency with the thief pipeline:_ rejected, its cards data isn't machine-accessible and the manual catalog gains nothing from a source we can't scrape.

**`id` = kebab-case slug of the set `name`.** Consistent with the 20 existing entries (`opulence`, `prosperity`, …). Single-word names slug to themselves (`labor`, `integrity`, `pleasure`). Deterministic, collision-free across the canonical names.

**Additive-only edit, alphabetical by `name`.** Insert the 14 new Heavens and 8 new Space entries into their alphabetical positions; leave existing entries byte-for-byte unchanged. Keeps the diff reviewable and guarantees no id churn for saved rows.

**Effect text matches existing terse style.** Existing entries summarize (`"10% fire damage"` / `"15% attack (30% if enemy weak to fire)"`), not full in-game sentences. New Heavens entries follow suit — 2pc/4pc effects sourced from the Game8 list page and condensed to the same register; the six whose 4pc the summarizer compressed were re-fetched verbatim from the same page before condensing.

**Space `effect` is pairing-based, so ALL 16 Space entries state the paired Heavens sets, not a standalone one-liner.** Investigation revealed Space sets have no standalone effect: their bonus is conditional on a specific Heavens set (Integrity's Game8 page lists "Integrity & Pleasure: …" and "Integrity & Labor: …"). Game8's list page carries no standalone Space effect string (confirmed: "NOT ON PAGE"). Rather than invent effect numbers or paste the summarizer's paraphrase, each Space `effect` factually names the Heavens sets it pairs with (e.g. `"Paired bonuses with Pleasure and Labor sets"`), sourced from the Game8 list pairings and corroborated by Integrity's per-set page. This keeps the field non-empty and truthful without modeling the full pairing table (out of scope). The **effect fields are currently unrendered** — no component reads `twoSetEffect`/`fourSetEffect`/`effect`; only `id`+`name` reach the UI — so the user-facing fix (selectable sets) does not depend on effect prose.

_Decision revised during apply (user-directed):_ the 8 **existing** Space entries were also normalized to this pairing style, replacing their prior standalone one-liners. Those one-liners were unverified seed data and modeled Space effects as standalone, which the pairing mechanic contradicts. Trade-off: the existing pairings come from the Game8 list summary (uncorroborated per-set, unlike Integrity), and the prior numeric detail is dropped — accepted because the field is unrendered and uniformity + a correct model outweigh unverified numbers. This makes the edit touch existing Space `effect` prose (still no id/rename/removal changes).

**Spec scenarios use "at least N" with corrected real names.** The canonical count (26/16) came through a summarizer; the spec keeps `at least` phrasing so a Game8 off-by-one doesn't invalidate it, while the enumerated examples are switched from the current fictional list to real set names (Control, Courage, … / Acceptance, Awareness, …).

## Risks / Trade-offs

- **Game8 effect text may be paraphrased or patch-versioned** → Heavens effects taken from the Game8 list page, the six summarizer-compressed 4pc effects re-fetched verbatim before condensing; a later data patch is a cheap follow-up edit.
- **Space sets have no standalone effect (pairing-conditional)** → every Space `effect` names the paired Heavens sets (sourced, non-fabricated) rather than inventing a one-liner. All 16 (existing + new) use this uniform style. Existing pairings are Game8-list-sourced (not per-set-corroborated) and the prior one-liner numbers are dropped; accepted because the field is unrendered and the pairing model is the correct one. Modeling the full per-pairing effect table remains out of scope.
- **Exact canonical count uncertain (26/16 from a summarizer)** → spec asserts `at least`, and apply cross-checks the count against the Game8 list page before finalizing; the array is the source of truth regardless.
- **A new slug could theoretically collide with an existing id** → the 22 new names are all distinct from the 20 existing names; verified by inspection during apply.
- **Manual catalog will drift again** → accepted trade-off (Non-Goal: no scraper). The pinned-source header comment makes the next manual refresh straightforward.
