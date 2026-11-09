# Design

## Context

Eighth game module over the mature per-game pattern (CLAUDE.md "Architecture — Per-Game Module Pattern"). Every shared seam this change needs already exists and has a live consumer: `createRosterPersistence` / `createPartyPersistence` config adapters, `useRoster` + `makeFieldUpdater`, `GameCardShell`, `PartiesView` with `PartyViewConfig.slots` (ZZZ is the three-uniform-slot precedent), `AddEntityModal`, `useRosterView`, and `scripts/lib/pipeline.mjs` including the P5X overlay helpers `applyOverlay` / `validateOverlaySeed`.

Explore-session recon (2026-11-09) verified the data source: Prydwen's CloudFront origin (`d2ankz0m1a0dsp.cloudfront.net`, the same host the P5X script uses because `www.prydwen.gg` 403s generic fetchers) serves `/page-data/chaos-zero-nightmare/characters/page-data.json` with 34 nodes (`unitId`, `slug`, `name`, `rarity`, `class`, `element`, `faction`, `isNew`) and per-slug detail page-data carrying `smallImage` (160²), `cardImage` (262×358), `fullImage` (800²), base stats, six `dupes` ranked `T1`–`T6`, and ten `potential` nodes. Two nodes are teaser placeholders with `class`/`element` `"Unknown"`. Prydwen lags the live game (34 vs 38 released + 3 announced per BlueStacks, Oct 2026), which is exactly the gap the P5X overlay seed was built for. A sibling `/partners/page-data.json` exists for Phase 2.

Domain decisions were pinned with the user in the explore session: level max 62 (not per-combatant), Ego as a single rung 0–6, Potential as a boolean, faction deferred, Partners deferred.

## Goals / Non-Goals

**Goals:**

- Ship the CZN module with zero new shared-layer patterns — config-adapter usage only.
- Reuse the P5X pipeline shape wholesale (Prydwen origin, per-run image-path parsing, overlay seed) so the two Prydwen-sourced scripts stay recognisably the same.
- Class / attribute taxonomy data-driven end-to-end (open strings + badge maps) so a new attribute never needs a code change.
- Leave an obvious seam for the Phase 2 Partner catalog.

**Non-Goals:**

- Partners (weapon analog) in any form, including a `partner_id` column — added later as an incremental migration.
- Memory Fragments, Save Data / deck builds, scoring, preference chains.
- Faction badge or filter; per-node Potential tracking; per-combatant level-cap (Unconscious Awakening) tracking.
- Non-English localization.

## Decisions

**D1 — Prydwen page-data via the CloudFront origin as the sole source, P5X-style.**
Verified live, structured JSON, stable slugs, already the proven approach for P5X. Alternatives: fan databases (chaoszeronightmare.net, Gamewith, Game8) are rendered HTML with inconsistent taxonomy — rejected as a fetched source; no official or datamined JSON exists. Risk of Prydwen lag is handled by the overlay seed (D3), not a second source. Game8 is the reference for hand-entering seed rows (taxonomy, release dates) — read by a person, never by the script.

**D2 — `id` = Prydwen `slug`, not `unitId`.**
P5X precedent: the slug is what the overlay seed must predict for hand-off, and it is human-readable in the DB. `unitId` is kept out of the catalog entirely (nothing consumes it). Alternative rejected: minting ids from names (`mintId`) — needless when the source already provides a stable slug.

**D3 — Overlay seed `scripts/seeds/czn-combatants.json`, validated and merged by the existing pipeline helpers.**
`validateOverlaySeed` with `required: ['id','name','rarity','class','element']`, `rarities: [4, 5]`; `applyOverlay` keyed on `id`, fetched wins, shadowed entries warned. Seed ships empty-or-minimal in this change; filling it with the 4–7 combatants Prydwen lacks is a data task, not a code task, and can land in the same PR or the next.

**D4 — Drop `class === 'Unknown' || element === 'Unknown'` nodes at generation.**
Prydwen publishes teaser nodes for announced combatants with placeholder taxonomy. Emitting them would put unpickable `Unknown` badges in the Add modal. Mirrors ZZZ dropping name-unresolvable beta entries. They surface in the diff as `added` the week they get real data.

**D5 — Store `class`, `element`, `faction` verbatim; present via lookup maps.**
Same as ZZZ D3 / P5X. Element names (Passion, Order, Justice, Void, Instinct) and class names are already display-ready, so the label map is identity for known values; the badge-class map carries the colours. `faction` is carried raw (`null` for ~20% of nodes, inconsistent bracket suffixes) so a later normalisation can happen in the script without a DB change — it is catalog-only data.

**D6 — Portrait = `cardImage` (262×358), fallback `smallImage`, uploaded as fetched; app uses the default `getMugshotUrl` / `getAvatarUrl` transforms.**
`cardImage` is the portrait crop Prydwen uses on its own cards and matches the aspect the existing mugshot transform expects, so no CZN-specific resolver in `imagekit.ts` and no `resolveImage` seam usage. `fullImage` (800² splash with light background) rejected for cards — wrong framing. Stored under ImageKit folder `chaos_zero_nightmare/combatants`, local path `/assets/chaos-zero-nightmare/combatants/{slug}.webp`, converted to webp via `sharp` like P5X.
Overlay-seed portraits are whatever `imageSource` reaches: as of 2026-11-09 the seven seeded units use Game8 per-character icons (150², Rossweisse 300², orange-framed) because `www.prydwen.gg` sits behind a Cloudflare challenge and no other reachable site carries card art. They render softer than the 262×358 cards; swap the URL and run `--reupload-combatants` when better art is found.

**D7 — DB columns `level`, `ego`, `potential_attained`, `is_favorited` with CHECKs (level 1–62, ego 0–6).**
Paired slider-max + DB CHECK convention. `ego` persisted as integer; the `T` prefix is presentation only. Potential follows HSR's `traces_attained` boolean exactly (column type, default false, summary chip via `getProgressStyle(0|1)`).

**D8 — Extend the `assert_game_table` allowlist in the CZN migration.**
`save_party` (and the other RPCs) gate every table name through `assert_game_table`, whose regex is `^(hsr|r1999|n2e|ae|p5x|zzz)_[a-z0-9_]+$`. Without a `czn` alternative, CZN party saves fail with `not a game table`. The migration SHALL `CREATE OR REPLACE FUNCTION assert_game_table` adding `czn` to the alternation and preserve the existing `SET search_path = public` and grants. This is the one piece ZZZ Phase 1 did not need (it predated the RPCs). Verify with the throwaway `postgres:16` harness per CLAUDE.md "Known Limitations".

**D9 — 3-slot parties via `PartyViewConfig.slots` with three uniform unfiltered slot configs (`Combatant 1–3`); DB CHECK `slot_index BETWEEN 0 AND 2`.**
Second consumer of the seam ZZZ opened, so no shared-component risk this time. No `companionSlot`.

**D10 — Naming: `chaos-zero-nightmare` dirs, `Czn` type prefix, `czn_` table prefix, `CznPage` at `/chaos-zero-nightmare`, `color.czn` tokens, `bg-czn-sel`.**
Long-form directory + short-id convention used by every other game. Registry entry placed after `n2e` and before `dgm` (roster games before the collection modality; order is deliberate per `games.ts`).

**D11 — Card edit-section order: Level → Manifest Ego → Potential.**
Mirrors the in-game progression gates (Potential unlocks at level 20; Ego is pull-driven) and the ZZZ card order (slider, rung, rung). Summary chips: `Lv {n}`, `T{n}`, `Potential ✓/✗`.

## Risks / Trade-offs

- [Prydwen page-data shape drift or origin change] → Script throws on missing `allCharacters.nodes` / `currentUnit` before any write; weekly workflow surfaces it as a failed run. Same posture as P5X.
- [Prydwen lag: combatants missing for weeks] → Overlay seed; upstream wins on hand-off, run warns to delete the seed entry.
- [Level cap 62 is wrong or rises] → Paired slider-max + CHECK change in a one-line migration; the number is called out in the spec so it is easy to find.
- [Forgetting the `assert_game_table` extension] → Config-wiring tests cannot catch a DB-side allowlist; the migration task names it explicitly and the manual verification pass saves a party against a real DB.
- [`cardImage` aspect differs from what `getMugshotUrl`'s crop assumes] → Spot-check after first upload; fall back to a CZN-specific resolver (ZZZ precedent) only if the default crop clips heads.
- [Open-string taxonomy lets a typo in the seed create a new badge category] → `validateOverlaySeed` checks presence, not vocabulary; the run output lists seed entries so a mismatch is visible in PR review. Acceptable for a seed of under ten entries.

## Migration Plan

1. Apply `supabase/migrations/<ts>_add_czn_tables.sql` (three tables, RLS, indexes, `assert_game_table` replace) to the Supabase project before merging the app change; the app is additive and tolerates the tables existing early.
2. Run `node scripts/update-czn-data.mjs` once locally to seed ImageKit and commit the generated `combatants.ts`.
3. Merge; Vercel deploys on push to `main`.
4. Rollback: remove the `GAMES` entry (hides the route and switcher item); tables can stay — dropping them is a separate migration if ever wanted.

## Open Questions

- ~~Which combatants to put in the initial overlay seed and where to source their card art.~~ Resolved 2026-11-09: seven entries — Rossweisse, Olga, Arabella, Hilde, Fei, Tenebria (both still `Unknown` teasers on Prydwen), Anika — with Game8 taxonomy and icons (see D6).
