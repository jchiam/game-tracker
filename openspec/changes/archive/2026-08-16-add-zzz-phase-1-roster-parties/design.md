## Context

Sixth game module over a mature per-game pattern (see CLAUDE.md "Architecture — Per-Game Module Pattern"). All machinery exists: `createRosterPersistence` / `createPartyPersistence` config adapters, `useRoster` skeleton + `makeFieldUpdater`, `GameCardShell`, `PartiesView` with `PartyViewConfig.slots`, `AddEntityModal`, `scripts/lib/pipeline.mjs`. HSR is the reference implementation for the update-script style (StarRailRes GitHub raw); AE/P5X are precedent for phase-1 scoped game adds. Explore-session recon (2026-08-16) verified data-source viability: Hakush.in and its nankoa.cc revival are dead (NXDOMAIN globally); ZenlessAssetScrape is stale/thin; Enka.Network store JSONs on GitHub raw are live, complete for agents/weapons/disc suits, and reachable.

## Goals / Non-Goals

**Goals:**

- Ship the ZZZ module with zero new shared-layer patterns — config-adapter usage only.
- Update script fetches Enka store data for agents but is shaped so Phases 2–3 (discs, W-Engines) plug in as additional emitters.
- Element/specialty taxonomy is data-driven end-to-end (open strings + badge maps) so mid-version element additions (ZZZ 2.x has added Wind, Lumen, ZhenZhenAssault) never break the app.
- 3-slot parties via existing `PartyViewConfig.slots` — validate the seam supports a uniform reduced slot count.

**Non-Goals:**

- Drive Discs, W-Engines, scoring, preference chains (Phases 2–3).
- Bangboo in any form (KIV) — including the `bangboo_id` column; the migration deliberately omits it, added later as an incremental migration.
- Faction data (no reliable source picked yet; Enka lacks it).
- Agent full names ("Anby Demara") — Enka locs carry display names only.
- Non-English localization.

## Decisions

**D1 — Enka.Network store as sole source.**
GitHub raw hosting = same reliability class as HSR's StarRailRes; actively maintained (powers Enka showcases); one source covers agents now and weapons/discs later, keyed by stable numeric ids. Alternatives: Hakush/nankoa (dead), ZenlessAssetScrape (26 agents, no rarity/specialty — rejected), Dimbreath ZenlessData on git.mero.moe (complete but raw game configs needing TextMap joins, non-GitHub host — kept as fallback and as the likely future faction/bangboo source).

**D2 — Name resolution via `locs.json` `en` table, keyed by the avatar's internal `Name`.**
Avatar entries carry internal names (`Avatar_Female_Size03_Sigrid`); display name comes from the loc table. Entries with no resolvable English name (beta placeholders) are dropped at generation time, mirroring how other pipelines exclude unreleased units.

**D3 — Store Enka taxonomy verbatim; present via lookup maps.**
`element` keeps codes like `Elec`/`Physics`/`FireFrost`; a display-label map renders `Electric`/`Physical`/`Frost` and a badge-class map colors them, both with neutral fallback. Rationale: catalog regeneration must never require a code change (P5X precedent: "Source taxonomy stored verbatim"). Alternative rejected: normalizing at generation time — loses source fidelity and breaks if two source codes collapse to one label.

**D4 — Rarity stored as Enka numeric code (4 = S, 3 = A), rendered as letter.**
Keeps the generated file mechanical; the S/A mapping is one presentation-layer lookup shared with future W-Engine rarity (which also uses numeric codes, incl. 2 = B).

**D5 — Portraits from Enka CDN (`enka.network` + avatar `Image` path) → ImageKit.**
Only the Node script touches the Enka CDN; the app resolves local paths through `imagekit.ts` as usual. No CSP change. `CircleIcon` variants are ignored in Phase 1 (party `slot-avatar` reuses the portrait with CSS crop, same as other games).

**D6 — DB columns: `level`, `mindscape`, `core_skill`, `is_favorited` with CHECK constraints (level 1–60, mindscape 0–6, core_skill 0–6).**
Matches the paired slider-max + DB CHECK convention. Core Skill persisted as integer 0–6, letter mapping (1→F … 6→A) is presentation only.

**D7 — 3-slot parties via `PartyViewConfig.slots` with three uniform, unfiltered slot configs.**
First uniform-but-not-four consumer of the seam. DB CHECK `slot_index BETWEEN 0 AND 2`. Alternative rejected: a `slotCount` config knob — `slots` already expresses this; adding a second mechanism duplicates the seam.

**D8 — Directory/naming: `zenless-zone-zero` dirs, `Zzz` type prefix, `zzz_` table prefix, `ZzzPage` route `/zenless-zone-zero`.**
Follows the long-form directory + short-id convention used by every other game (`persona-5-phantom-x`/`p5x`).

## Risks / Trade-offs

- [Enka store schema drift or repo restructure] → Script fails loudly on fetch/parse; weekly workflow surfaces it as a failed run, not silent bad data. Dimbreath mero.moe documented as fallback source in the script header.
- [Enka rarity/element codes change meaning] → Verbatim storage means UI labels may lag, but data stays correct; badge fallback keeps rendering.
- [Duplicate protagonist entries (Wise/Belle share ids/skins)] → Generation dedupes by avatar id; if both protagonists appear as separate ids they are kept as distinct entries (harmless — user tracks the one they play).
- [3-slot `slots` config exposes a latent four-slot assumption in `PartiesView`] → Config-wiring tests assert 3 rendered slots and out-of-range save rejection; any gap found is fixed in the shared component behind the existing spec.
- [ImageKit folder naming locked early (`zenless_zone_zero`)] → Matches existing snake_case folder convention (`honkai_star_rail`); rename later is a `--reupload-all` run.

## Open Questions

- Faction source (Dimbreath vs hoyowiki vs manual seed) — deferred; Phase-1 schema and catalog omit the field entirely, so any choice later is additive.
- Whether Phase 2 wants `CircleIcon` crops from Enka for disc-slot/party avatars — decide when building the disc editor.
