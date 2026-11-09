# Proposal

## Why

Chaos Zero Nightmare Phase 1 (archived `2026-11-09-add-czn-phase-1-roster-parties`) ships the combatant roster and 3-slot parties but no Partners — the per-combatant support unit that is CZN's weapon analog (one Partner assigned per Combatant; its passive only activates when its class matches the Combatant's). Players track which Partner each Combatant runs and how far it is levelled, exactly as they track psychubes in Reverse: 1999 and weapons in Arknights: Endfield. This is **Phase 2**: the Partner catalog and the per-combatant equip + preference tracking. Memory Fragments (gear) stay deferred to Phase 3.

## What Changes

- New generated catalog `src/data/chaos-zero-nightmare/partners.ts` — `CznPartner { id, name, rarity, class, faction, imageUrl }`, rarity `3 | 4 | 5`, class in Prydwen's six-class vocabulary already used by combatants, faction raw and catalog-only. `id` is a kebab-case slug minted from the name (Prydwen's partner list carries no slug and has no per-partner pages).
- `scripts/update-czn-data.mjs` gains a `processPartners()` section beside `processCombatants()`: the Prydwen partners page-data at `/page-data/chaos-zero-nightmare/partners/page-data.json` lists only taxonomy; the images live in the page's Gatsby static query (`/page-data/sq/d/<hash>.json`, `allContentfulChaosPartner.nodes`, 44 nodes today) whose hash is read from the page-data's `staticQueryHashes` each run — never hardcoded. Partner icons (`smallImage`, 160²) upload to ImageKit `chaos_zero_nightmare/partners`. A new overlay seed `scripts/seeds/czn-partners.json` covers Partners Prydwen lags on (Game8 lists 52 vs Prydwen's 44 as of 2026-11-09, e.g. Sig, Emilie). `--reupload-partners` flag. The weekly workflow's PR copy covers both catalogs.
- New tracked fields on `CznTrackedCombatant`: `partnerId` (slug or `null`), `partnerLevel` (1–60), `partnerEgo` (Manifest Ego rank 0–4, shown `T0`–`T4`), `partnerPreferences` (ordered slug list, highest priority first, no duplicates). Incremental migration adds the four columns to `czn_tracked_combatants` with paired CHECKs.
- Combatant card gains a Partner summary line (name · `Lv n` · `T{n}`, or an empty dash) with an equipped-vs-preferred match badge, plus two edit sections: **Partner** (`Select` scoped to Partners whose class equals the Combatant's class, `LevelSlider` 1–60, `SegmentedButtons` T0–T4) and **Preferred Partners** (`PreferenceChain` ranked list over the same class-scoped options). Edit-section order becomes Level → Manifest Ego → Potential → Partner → Preferred Partners.
- The equipped-vs-preferred match pill currently declared as `.weapon-match-badge` in AE's `OperatorCard.css` is promoted to `card.css` as the shared `.pref-match-badge`; AE adopts the shared class. No visual change for AE.
- Docs: `CONTEXT.md` gains the **Partner** noun under CZN; `CLAUDE.md`'s `czn` Catalog Data Sources block documents the static-query seam, the minted-slug rule, and the partner seed.
- **Deferred** (explicitly out of scope): Memory Fragments and scoring (Phase 3), Partner passive/Ego skill text in the catalog, Partner icon shown on the card, faction badge/filter, roster filter chips for Partner state.

## Capabilities

### New Capabilities

- `czn-partner-catalog`: Generated static catalog of CZN Partners (`ALL_CZN_PARTNERS`) with minted kebab-case ids, verbatim class/faction vocabulary, 160² icon paths, and the hand-curated overlay seed for Partners the source lacks.
- `czn-partner-tracking`: Per-combatant equipped Partner (id, level 1–60, Manifest Ego 0–4), the class-scoped Partner picker, the ordered preferred-Partners list, the equipped-vs-preferred match badge, and the card's Partner summary line and edit sections.

### Modified Capabilities

- `czn-data-pipeline`: The update script also emits `partners.ts` and seeds partner icons; the "extensibility for Partners" placeholder requirement is replaced by the concrete partner emitter requirement (static-query resolution, `--reupload-partners`, partner overlay seed, workflow copy).
- `czn-combatant-detail`: Card composition gains the Partner summary line and the Partner / Preferred Partners edit sections in a fixed order.
- `shared-card-base`: The equipped-vs-preferred match pill (`.pref-match-badge`) is defined once in `card.css` and consumed by every game card that renders one.

## Impact

- **New code**: `src/data/chaos-zero-nightmare/partners.ts` (generated), `scripts/seeds/czn-partners.json`, `scripts/lib/czn-partners.mjs` (+ test: static-query selection, seed id rule), `src/pages/chaos-zero-nightmare/components/partnerSort.ts` (+ test), `partnerMatch.ts` (+ test).
- **Modified code**: `scripts/update-czn-data.mjs` (partner section, flag, header comment), `.github/workflows/update-czn-data.yml` (PR copy), `src/types.ts` (`CznTrackedCombatant`, `CznCombatantPatch`, new `CznPartnerPatch`), `src/hooks/chaos-zero-nightmare/combatantLimits.ts` (partner caps), `useCombatants.ts` (+ test), `combatantService.ts` (+ test: column map, select, defaults), `CombatantCard.tsx` / `.css` (+ test), `CznPage.tsx` (+ test), `src/styles/card.css` (`.pref-match-badge`) and the `CardPatterns` Storybook story, `src/pages/arknights-endfield/components/OperatorCard.tsx` / `.css` (class rename), `CLAUDE.md`, `CONTEXT.md`.
- **Database**: one additive migration on `czn_tracked_combatants` — `partner_id TEXT`, `partner_level SMALLINT NOT NULL DEFAULT 1 CHECK (1–60)`, `partner_ego SMALLINT NOT NULL DEFAULT 0 CHECK (0–4)`, `partner_preferences TEXT[] NOT NULL DEFAULT '{}'`. No RPC, RLS, or allowlist changes (policies already cover the table).
- **Infra**: ImageKit gains a `chaos_zero_nightmare/partners` folder. No CSP change (Prydwen origin touched only by the Node script).
- **No breaking changes**: existing CZN rows load with the column defaults; AE's badge rename is CSS-only.
