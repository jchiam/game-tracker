## Context

Four games are live (HSR, R1999, N2E, AE), all built on the game-module pattern:
static catalog → config-adapter service over `rosterPersistence` → roster hook over
`useRoster` → page composing `GameCardShell` + shared `PartiesView`. AE (June 2026)
is the closest scope precedent (roster + parties MVP, equipment later); HSR/R1999 are
the data-pipeline precedents (community-source update script + weekly auto-PR
workflow), which P5X follows because a structured source exists.

P5X facts (web-verified 2026-07-05):

- Rarity 4★/5★; roles Assassin, Sweeper, Medic, Saboteur, Guardian, Strategist,
  Virtuoso (added v2.7); elements Physical, Fire, Wind, Ice, Electric, Nuclear,
  Bless, Curse. Each Thief carries a bound Persona (display name).
- Level cap 80 (live cap; has risen with versions).
- Dupe system: **Awareness**, ranks A0–A6, advanced with "Cognite" items.
- Combat party: protagonist (locked) + 3 picks, plus Navigator and Elucidator-summon
  meta-slots.
- **Structured data source exists: Prydwen.** `prydwen.gg/persona-5x` is a Gatsby
  site whose `page-data.json` endpoints expose full structured data (verified
  2026-07-05 via the CloudFront origin `d2ankz0m1a0dsp.cloudfront.net`):
  - List endpoint `/page-data/persona-5x/characters/page-data.json`: 60 characters
    with `unitId`, `slug`, `name`, `codename`, `rarity` (4|5), `element`, `job`.
  - Detail endpoints `/page-data/persona-5x/characters/{slug}/page-data.json`:
    persona name, skills, awareness names, and Gatsby image nodes whose hashed
    `/static/.../{unitId}_sm.webp` and `{unitId}_card.webp` paths are embedded in
    the JSON.
  - Elements observed: Physical, Fire, Ice, Electric, Wind, Psychokinesis, Nuclear,
    Bless, Curse, Gun, Almighty. Jobs observed: Single-target, Multi-target, Buffer,
    Debuffer, Healer, Tank, Navigator, Virtuoso.
  - The main `www.prydwen.gg` domain 403s generic fetchers (Cloudflare); the
    CloudFront origin serves the same JSON unblocked. AE's seed script already
    consumes Prydwen's image CDN, so the dependency has precedent.
  - Weaker alternatives rejected: P5XDB repo is an empty Jekyll shell; datamine
    extractors are too raw; Game8/fandom are prose wikis (scrape-hostile).

## Goals / Non-Goals

**Goals:**

- P5X roster tracking: add/remove Thieves, level (1–80), Awareness (A0–A6), favorite,
  sort, search.
- P5X lineups: 4-slot parties with tier + favorite, via shared `PartiesView`.
- Full wiring: registry entry, route, tokens, migration, CONTEXT.md nouns.

**Goals (continued):**

- Automated data pipeline like HSR/R1999: `scripts/update-p5x-data.mjs` over the
  Prydwen page-data source + weekly `update-p5x-data.yml` GitHub Action with
  auto-PR — the catalog is generated, never hand-edited.

**Non-Goals:**

- Weapons, Revelation cards, skill levels, build preferences, scoring — the Prydwen
  detail endpoints carry skill/build data, but Phase 1 maps only catalog fields.
- Navigator/Elucidator party slots or protagonist-lock enforcement — the tracker is a
  lineup notebook, not a battle simulator.

## Decisions

### D1 — Entity noun: Thief

Game groups playable units as "Phantom Thieves" and "Phantom Idols"; **Thief** is the
short, distinct noun. Drives `ALL_THIEVES`, `useThieves`, `thiefService`, `ThiefCard`,
`AddThiefModal`, `p5x_tracked_thieves`. Alternative "Character" rejected — already
used by N2E (`characters.ts`) and generic in CONTEXT.md ("Tracked Entity" is the
umbrella term); a game-specific noun matches Operator/Arcanist/Esper precedent.

### D2 — Identity: `p5x` / `/persona-5-phantom-x` / `P5x*` types

Short id `p5x` for commits, tokens (`color.p5x`), DB prefix, and `bg-p5x-sel`. Route
uses the full-name slug like every other game. TypeScript prefix `P5x` (matches `Ae`
casing convention): `P5xThief`, `P5xTrackedThief`, `P5xThiefPatch`, `P5xParty`,
`P5xPartyMember`. Directory name `persona-5-phantom-x` across `src/data`,
`src/services`, `src/hooks`, `src/pages`.

### D3 — Generated catalog from Prydwen page-data (HSR/R1999 playbook)

`src/data/persona-5-phantom-x/thieves.ts` is **generated** by
`scripts/update-p5x-data.mjs` (never hand-edited, standard generated-file banner),
composing `scripts/lib/pipeline.mjs` exactly like `update-hsr-data.mjs`:

1. Fetch the character-list page-data JSON from the Prydwen CloudFront origin.
2. For each character, fetch its detail page-data to obtain `personaName` and the
   embedded hashed image paths — image URLs are read from the JSON on every run, so
   Gatsby build-hash churn cannot break downloads.
3. Download the card image, upload via `ensureAsset` to ImageKit under
   `/persona-5-phantom-x/thieves/{slug}.webp` (idempotent, `--reupload-*` flags).
4. Regenerate `thieves.ts` with catalog diffing (`diffByKey`/`formatDiff`).

Prydwen's `slug` is the catalog `id`. A weekly `.github/workflows/update-p5x-data.yml`
(cron + manual dispatch, auto-PR) matches the other games' workflows. Variant units
(e.g. Seaside Tomoko) arrive as distinct Prydwen entries — no special modeling.

Alternatives considered: hand-authored catalog (AE playbook) — rejected now that a
structured source is verified; Game8/fandom scraping — prose-page parsing, brittle
and scrape-hostile; datamine repos — raw encrypted bundles, no parsed stats.

### D3a — Store Prydwen taxonomy verbatim

`role` stores Prydwen's `job` value as-is (`Single-target`, `Multi-target`, `Buffer`,
`Debuffer`, `Healer`, `Tank`, `Navigator`, `Virtuoso`); `element` likewise
(`Psychokinesis`, `Gun`, `Almighty` included). No mapping to the in-game role names
(Assassin/Sweeper/Medic/Saboteur/Guardian/Strategist) — a static rename table would
be lossy (Navigator has no in-game combat-role equivalent), needs maintenance when
either taxonomy shifts, and risks mislabeling. Both fields are open strings; a
display-name mapping can be layered in the card later without touching data.
Navigator-type units stay in the catalog — they are collectible gacha units even
though they never occupy a combat slot.

### D4 — Tracked fields: level + awareness only

`P5xTrackedThief = P5xThief + { level: 1–80, awareness: 0–6, isFavorited, dbId }`.
Awareness renders as an A0–A6 `SegmentedButtons` row (investment coloring), level as
`LevelSlider`. Level cap 80 is a live-game value; a future cap raise is a one-line
catalog/constant change plus a CHECK-constraint migration. No weapon/skill fields —
avoids AE's later `expand_ae_operator_fields` churn by explicitly scoping them out.

### D5 — Party shape: plain 4 slots, HSR semantics

`slot_index` CHECK 0–3, `UNIQUE(party_id, slot_index)`. `partyService.ts` composes
`createPartyPersistence` with tier + favorite enabled (parity with the other four
games post tier/favorite propagation). Protagonist lock and Navigator/Elucidator
slots deliberately unmodeled — Phase-2 candidates if wanted.

### D6 — Migration: single `20260707000000_add_p5x_tables.sql`

Three tables (`p5x_tracked_thieves`, `p5x_parties`, `p5x_party_members`) following
DB conventions: UUID PKs, `profile_id` FK cascade, unique `(profile_id, thief_id)`,
RLS user-scoped policies, indexes on `profile_id` / `party_id`. Parties include
`tier` + `is_favorited` from day one (no follow-up migrations like HSR/AE needed).
Timestamp sorts after the latest existing migration (20260706…).

## Risks / Trade-offs

- [Prydwen is an unofficial fan site — page-data schema or URL scheme can change
  without notice] → Same class of dependency as StarRailRes/kornblume (community
  sources, accepted for HSR/R1999). The weekly workflow fails loudly (CI red, no
  auto-PR) rather than corrupting the catalog; catalog diffing makes any unexpected
  change reviewable in the PR.
- [Cloudflare blocks on `www.prydwen.gg`] → Script targets the CloudFront origin,
  which serves identical JSON unblocked (verified). If the origin hostname rotates
  on a Gatsby redeploy, the script fails loudly and the constant is a one-line fix.
- [Gatsby hashed image paths change every site build] → Image URLs are parsed from
  the freshly fetched page-data JSON on each run, never hardcoded; `ensureAsset`
  skips already-uploaded ImageKit assets, so hash churn costs nothing.
- [Level cap rises in a future version] → Slider max + DB CHECK both encode 80; a cap
  bump is a small paired change. Chose correctness-now over speculative headroom.
- [Role/element vocab grows (Virtuoso precedent)] → Both stored as open strings —
  same as AE's `class` — so new values are data, not type changes.
- [Prydwen taxonomy diverges from in-game names (e.g. `Single-target` vs Assassin)]
  → Accepted verbatim storage (D3a); a display mapping is a pure-UI follow-up if it
  ever bothers users.

## Migration Plan

1. Apply the migration in Supabase (additive only — no existing tables touched).
2. Ship the code; the route only renders data for signed-in users with rows.
3. Rollback: drop the three `p5x_*` tables and revert the code — no shared-table
   changes to unwind.

## Open Questions

- ~~Psy/Gun as playable-unit elements~~ — resolved: Prydwen data includes
  Psychokinesis, Gun, and Almighty elements.
- ~~Exact live roster size~~ — resolved: 60 units in the Prydwen dataset
  (2026-07-05), including Navigator-type units.
- Whether Prydwen's card image (`{unitId}_card.webp`) or small icon (`{unitId}_sm.webp`)
  fits the roster-card header best: decide during implementation; both paths are in
  the same detail JSON.
