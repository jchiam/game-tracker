## Why

Users want to track their **Zenless Zone Zero** (HoYoverse) rosters alongside the five existing games. ZZZ is structurally the closest analog to HSR the tracker has ever added (Agents ≈ Characters, W-Engines ≈ Light Cones, Drive Discs ≈ Relics, Mindscape ≈ Eidolons), so full HSR parity is the end state — delivered in phases. This change is **Phase 1 of 3**: data pipeline, agent roster, and 3-slot parties. Phase 2 (Drive Disc editor + build preferences + scoring) and Phase 3 (W-Engine equip + preference strip + score blend) follow as separate changes. Bangboo support is explicitly KIV pending domain research.

## What Changes

- Add **Zenless Zone Zero** as the 6th game module (`id: 'zzz'`), following the per-game module pattern. HSR is the closest existing template.
- New automated update script `scripts/update-zzz-data.mjs` composing `scripts/lib/pipeline.mjs`, sourcing the **Enka.Network store** (`EnkaNetwork/API-docs` GitHub raw: `store/zzz/avatars.json`, `locs.json`; `property.json` joins in Phase 2 for stat names) — chosen after verifying Hakush.in and its nankoa.cc revival are dead (NXDOMAIN) and ZenlessAssetScrape is too thin (26 agents, no rarity/specialty). Weekly GitHub Actions workflow `update-zzz-data.yml` auto-creates a PR on changes.
- New generated catalog `src/data/zenless-zone-zero/agents.ts` — `ZzzAgent { id, name, rarity, specialty, element, imageUrl }`. Element is an **exact open string** (verified live set: `Elec`, `Physics`, `Fire`, `Ice`, `Ether`, `FireFrost`, `AuricEther`, `ZhenZhenAssault`, `Wind`, `Lumen`) with a data-driven badge map — never a closed union. Specialty includes `Rupture`. Faction is **deferred** (Enka lacks it; source TBD: Dimbreath parse, hoyowiki scrape, or manual seed).
- New tracked entity `ZzzTrackedAgent` with `level` (1–60), `mindscape` (M0–M6), `coreSkill` (0–6, displayed as the F→A rung ladder), `isFavorited`.
- Agent card composed from `GameCardShell`: specialty + element badges, rarity indicator, level slider, Mindscape + Core Skill `SegmentedButtons`.
- Full **Parties/Lineups** stack for **3-agent squads** (`slot_index` 0–2) via the shared `PartiesView` config adapter — first game with 3 uniform slots (uses `PartyViewConfig.slots`).
- App wiring: `types.ts`, `GAMES` registry entry in `src/lib/games.ts`, `index.css` `bg-zzz-sel`, design tokens `color.zzz`, Supabase migration (3 tables + RLS).
- Agent portraits downloaded from the Enka CDN by the update script and uploaded to ImageKit as **untouched originals** — display crops (trim transparent canvas + top-anchored square for cards, face crop for avatars) are on-the-fly ImageKit transforms via new ZZZ-specific resolvers in `imagekit.ts`, passed through new optional `resolveImage` seams on `GameCardShell` and `AddEntityModal`. No repo images, no CSP change.
- **Deferred to later phases** (explicitly out of scope): Drive Disc catalog/editor/scoring (Phase 2), W-Engine catalog/equip/preferences (Phase 3), Bangboo (KIV), faction field, agent full names (not in Enka store).

## Capabilities

### New Capabilities

- `zzz-data-pipeline`: Automated ZZZ catalog update script + weekly workflow — Enka store fetch, loc/name resolution, agent codegen, ImageKit portrait seeding, catalog diff reporting; structured so Phases 2–3 extend it with Drive Disc and W-Engine catalogs.
- `zzz-agent-catalog`: Generated static catalog of ZZZ Agents (`ALL_ZZZ_AGENTS`) with exact source taxonomy (open element strings, specialty incl. Rupture).
- `zzz-agent-detail`: Per-agent tracked fields — level (1–60), Mindscape (0–6), Core Skill rung (0–6, F→A), favorite toggle, level-based sort, and Fuse.js search keys (name, specialty, element).

### Modified Capabilities

- `shared-parties`: Add ZZZ party slot constraints (3 uniform slots, indices 0–2) — first game to use `PartyViewConfig.slots` for a uniform-but-not-four slot count; ZZZ joins the games enumerated under the party favorite toggle and tier requirements.
- `shared-ui-components`: `GameCardShell` gains an optional `resolveImage` prop overriding the header-image URL resolver (default `getMugshotUrl` unchanged) — needed because ZZZ stores untouched full-body originals and crops on the fly.
- `shared-entity-picker`: `AddEntityModal` gains an optional `resolveImage` prop overriding the list-avatar URL resolver (default `getAvatarUrl` unchanged), for the same reason.

## Impact

- **New code**: `src/data/zenless-zone-zero/agents.ts` (generated), `src/services/zenless-zone-zero/{agentService,partyService}.ts`, `src/hooks/zenless-zone-zero/{useAgents,useParties}.ts`, `src/pages/zenless-zone-zero/` (page + components), `scripts/update-zzz-data.mjs`, `.github/workflows/update-zzz-data.yml`.
- **Modified code**: `src/types.ts` (`ZzzAgent`, `ZzzTrackedAgent`, `ZzzParty`, `ZzzPartyMember`), `src/lib/games.ts`, `src/index.css`, `src/styles/design-tokens.json` (`color.zzz`), `src/components/parties/` only if the 3-uniform-slot config surfaces a gap.
- **Database**: new migration `zzz_tracked_agents`, `zzz_parties`, `zzz_party_members` (slot_index CHECK 0–2), all with RLS + user-scoped policies + standard indexes. Bangboo deliberately absent; a later `bangboo_id` column on `zzz_parties` is the planned seam.
- **Infra**: ImageKit gains a `zenless_zone_zero` asset folder. No CSP change (Enka CDN touched only by the Node script).
- **No breaking changes** to existing games.
