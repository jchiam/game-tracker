# Proposal

## Why

The CZN update script reads combatants from Prydwen's CloudFront origin (`d2ankz0m1a0dsp.cloudfront.net`), which stopped receiving site builds on 2026-05-27 (`Last-Modified` on `app-data.json`). The live `www.prydwen.gg` sits behind a Cloudflare JS challenge (`403`, `cf-mitigated: challenge`) that a script cannot pass. Every combatant released since (Rossweisse, Olga, Arabella, Hilde, Fei, Tenebria, Anika, Blazebell) and every Partner (Sig, Emilie, Vivian, …) has had to be hand-added to an overlay seed, so the weekly workflow never surfaces a new unit on its own.

Game8's CZN character list (`archives/558105`) is current (Blazebell, 2026-11-11, is listed) and is rendered from a structured JSON endpoint, `/api/tool_structural_mappings/<id>.json`, reachable by plain `fetch`. Its 40 released entries match the current catalog one-for-one on name, minted id, rarity, class, and element. The Partner list (`archives/558133`, same tool shape) has 51 released Partners matching the catalog on rarity and class; two spell their names differently from Prydwen (`Lillian` / `lilian`, `Westmacott` / `westmaccot`).

## What Changes

- The combatant **list and taxonomy** (membership, name, rarity, class, element, faction) come from Game8's collection JSON. The mapping id and `updatedAt` are read each run from the list page's `data-react-props`, never hardcoded.
- Combatant ids are `slugify(name, '-')` — identical to the Prydwen slugs for all 40 current units, so tracked rows are untouched.
- **Portraits** keep Prydwen card art where it exists: the CloudFront list is still fetched, and a Game8 entry whose slug matches a Prydwen node with real taxonomy takes that node's `cardImage`. Every other entry uses Game8's `imageUrl` (150–300 px framed icon).
- A Prydwen fetch failure no longer aborts the run — it warns and falls back to Game8 icons — except under `--reupload-combatants` / `--reupload-all`, where it aborts so card art is never overwritten by icons.
- **Id-churn guard**: a run whose regenerated combatant catalog would drop an existing id aborts (tracked rows key on ids). `--allow-removals` overrides it.
- `faction` changes to Game8's top-level faction (`Terrascion`, not `Terrascion [Planet-Born]`), and four `null` factions are filled. Faction is catalog-only (no badge, filter, or UI read), so nothing renders differently.
- The overlay seed stays (Game8 wins on collision, shadow warning names Game8). All 8 current entries are covered by Game8 and are deleted.
- The **Partner list and taxonomy** come from Game8's Partner-list collection JSON the same way. Prydwen's static query still supplies the 160² icons for the 44 Partners it knows (joined by id); the rest use Game8's icon. Same degrade-unless-reuploading rule.
- **Id pins**: `scripts/seeds/czn-id-pins.json` maps a Game8 item id to a committed id, so a Game8 respelling keeps the id tracked rows use. Seeded with `Lillian → lilian` and `Westmacott → westmaccot`; their display names take Game8's spelling.
- The id-churn guard covers combatants, Partners, and Memory Fragment sets.
- An unknown class or attribute is emitted verbatim (open taxonomy, as `czn-combatant-catalog` / `czn-partner-catalog` require) and warned about, not aborted on.
- Both the combatant and Partner overlay seeds are emptied (all 7 Partner seed entries, incl. Vivian, are on Game8). Memory Fragment sets are unchanged (still Prydwen + seed). P5X is out of scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `czn-data-pipeline`: the update-script requirement (combatant source), the placeholder requirement (released filter on Game8), the portrait requirement (Prydwen-if-joined, else Game8), the generated-catalog requirement (seed shadowed by Game8), the Partner-catalog requirement (Game8 list, Prydwen icons), and a new id-stability requirement (pins + removal guard for all three catalogs).
- `czn-partner-catalog`: the Partner-id requirement (pins keep a committed id across a respelling).
- `czn-combatant-catalog`: `id` is the name slug (equal to the Prydwen slug); the overlay seed covers units Game8 lacks and its `id` must be the slug of its `name` (now enforced, as for the Partner and set seeds).

## Impact

- `scripts/update-czn-data.mjs` — `processCombatants` and `processPartners` rewritten around the Game8 lists; Prydwen fetches limited to art; removal guard on all three catalogs.
- `scripts/seeds/czn-id-pins.json` (new) — id pins.
- `scripts/lib/czn-game8.mjs` (new) + test — mapping-props extraction and collection-item validation/mapping, pure functions.
- `scripts/seeds/czn-combatants.json`, `czn-partners.json` — emptied to `[]`.
- `src/data/chaos-zero-nightmare/combatants.ts` — regenerated (27 faction values; Blazebell added).
- `src/data/chaos-zero-nightmare/partners.ts` — regenerated (Vivian added; `Lilian` → `Lillian`, `Westmaccot` → `Westmacott` display names; 4 faction values).
- `scripts/lib/czn-seeds.mjs` — the minted-id rule now also applies to the combatant seed.
- `CLAUDE.md` "Catalog Data Sources (`czn`)", the workflow PR body, and the wiki (Data-Architecture, Development, Game-Trackers) — rewritten for the new source split.
- No CSP change: only the build-time script contacts Game8; the app serves portraits from ImageKit.
