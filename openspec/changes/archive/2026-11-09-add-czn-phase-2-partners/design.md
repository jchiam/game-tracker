# Design

## Context

See `proposal.md` — Why. Phase 1 (`openspec/changes/archive/2026-11-09-add-czn-phase-1-roster-parties/design.md`) left two seams for this change: the script header promises a `processPartners()` section beside `processCombatants()` reusing `PRYDWEN_ORIGIN`, `gatsbyImagePath`, and `uploadPortrait`; and D-Non-Goals reserved a `partner_id` column for an incremental migration.

Recon on 2026-11-09 against the CloudFront origin: `/page-data/chaos-zero-nightmare/partners/page-data.json` lists 44 `allCharacters.nodes` with `unitId`, `name`, `rarity` (`"3" | "4" | "5"`), `class`, `faction`, `isNew` — no `slug`, no `element`, no image. Per-partner detail pages do not exist (`/partners/<slug>/page-data.json` → 404). The images and skill text live in the page's Gatsby static query, `staticQueryHashes: ['1620298052']` → `/page-data/sq/d/1620298052.json` → `allContentfulChaosPartner.nodes` (44), each carrying `smallImage` (160²) and `fullImage` (800²) gatsby image nodes, `stats`, `passiveName`, `passiveEffect`, `egoName`, `egoCost`, `egoDescription`. `/static/...webp` paths resolve on the origin (HTTP 200, `image/webp`). Classes are the six combatant classes; factions add `Peltion`, `Sileyma`, `SS Edenity`, `The Holy Crusaders`. Prydwen lags the game here too: Game8 lists 52 Partners (Sig added 2026-10-21, Emilie tagged new).

Domain facts pinned with the user (they play the game): one Partner per Combatant; the passive activates only when Partner class equals Combatant class (GameWith Partner guide); level cap 60 (Game8 shows Partner stats "at Level 60"; GameWith notes caps rise through Promotion missions without a number — the user chose 60); Manifest Ego for Partners caps at 4 dupes (GameWith: "four identical Partners … to fully upgrade"; Game8 tier list speaks of "manifest ego level 0 / 4"), shown T0–T4 like the combatant rung; tracking shape is R1999 psychube–like (equip columns on the combatant row) plus an AE-style preferred list.

## Goals / Non-Goals

**Goals:**

- Partner catalog + equip/preference tracking with zero new shared-layer patterns beyond one CSS promotion.
- Preserve the Phase 1 combatant pipeline path unchanged; add the partner path beside it.
- Keep the card's existing section order and summary chips; append, never reshuffle.

**Non-Goals:**

- A Partner roster view, Partner cards, or a tracked-partners table (Partners are not tracked as independent entities; they are a per-combatant equip, like psychubes).
- Partner passive/Ego text, stats, or `egoCost` in the catalog or UI.
- Showing the Partner icon on the card (the icon is uploaded so later UI can use it; the summary line is text).
- Roster filter chips or sort modes on Partner state; Fuse search over Partner names.
- Class-mismatch enforcement at the DB level (the picker scopes; the column is a plain nullable text).

## Decisions

**D1 — Partner source = page-data `staticQueryHashes` → `sq/d/<hash>.json` → `allContentfulChaosPartner.nodes`, resolved per run.**
The list page-data lacks images and there are no detail pages, so the static query is the only structured place the icon paths exist. Hashes change per Gatsby build, so the script reads `staticQueryHashes` from the freshly fetched page-data and picks the payload that carries `allContentfulChaosPartner.nodes` (today there is exactly one hash; iterating keeps it robust if Prydwen adds another). Alternatives: hardcoding `1620298052` (breaks on the next build); scraping the rendered HTML (403 behind Cloudflare); Game8 as a fetched source (rendered HTML, no structured endpoint). The static-query payload also carries `name`/`rarity`/`class`/`faction`, so the list page-data is fetched only for its hash list and as a cross-check that node counts agree (warn, do not fail, on a mismatch — the two queries come from the same Contentful space and drift only mid-deploy).

**D2 — `id` = `slugify(name, '-')` via the pipeline's `mintId` (no `pinned`, kebab separator).**
No upstream slug exists and Prydwen has no partner pages to predict a slug from, so the name is the only stable identity. `mintId` already throws on collisions. Kebab-case matches the combatant ids and the seed validator's `KEBAB_SLUG`. `unitId` is kept out of the catalog (nothing consumes it; P5X/Phase 1 precedent). The seed validator gains an extra check that a seed entry's `id` equals `slugify(name, '-')` so hand-off is guaranteed — implemented as a CZN-specific post-validation (`assertPartnerSeedIds` in `scripts/lib/czn-partners.mjs`, beside the static-query selector `selectPartnerNodes`), not a `validateOverlaySeed` option, because only this catalog mints ids from names. Both helpers are pure so the source-shape and seed rules are unit-tested without the script's top-level env/ImageKit side effects.

**D3 — Catalog shape `CznPartner { id, name, rarity: 3 | 4 | 5, class: string, faction: string | null, imageUrl }`; sorted rarity desc, name asc at generation.**
Mirrors `CznCombatant` minus `element` (Partners have none) and with three rarities. Passive/Ego text is deliberately dropped: it is copy, not tracked state, and would bloat the generated file. Sorting at generation gives the picker a stable order and keeps `partners.ts` diffs readable; the card still applies `sortPartnersForDisplay` (rarity desc / `localeCompare`) after the class filter so display order never depends on file order — the AE `weaponSort` precedent.

**D4 — Icon = `smallImage` (160²) uploaded as webp at source size to ImageKit `chaos_zero_nightmare/partners/{id}.webp`; `fullImage` rejected.**
160² is the right asset for any future avatar/picker use (`getAvatarUrl` targets 128²) and is 7 KB each; the 800² splash has the wrong framing and no consumer. Reuses `uploadPortrait` renamed to a neutral `uploadAsset` wrapper, or called as-is — the wrapper is already asset-agnostic. No CZN-specific resolver. Phase 2 UI does not render the icon (Non-Goal), so a missing icon degrades to nothing visible.

**D5 — Overlay seed `scripts/seeds/czn-partners.json`, validated by `validateOverlaySeed` (`required: ['id','name','rarity','class']`, `rarities: [3, 4, 5]`) plus the D2 id-equals-slug check; merged with `applyOverlay` keyed on `id`.**
Same shape and warnings as the combatant seed. Initial content is a data task: the Partners Game8 lists that Prydwen lacks (Sig, Emilie, and whichever of the eight-entry gap can be verified), with `imageSource` pointing at Game8 icons as for the combatant seed, or `null`.

**D6 — Four additive columns on `czn_tracked_combatants`, one migration `20261109000001_add_czn_partner_tracking.sql`:**
`partner_id TEXT` (nullable, catalog id), `partner_level SMALLINT NOT NULL DEFAULT 1 CHECK (partner_level BETWEEN 1 AND 60)`, `partner_ego SMALLINT NOT NULL DEFAULT 0 CHECK (partner_ego BETWEEN 0 AND 4)`, `partner_preferences TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`. P5X weapon migration (`20260709000002`) is the column template; AE weapon-preferences migration (`20260629000000`) the array-column template. Alternatives: a `czn_tracked_partners` table (rejected — Partners are not independently tracked, per the psychube pin); a child preference table (rejected — the array column is the established atomic single-update pattern). No RPC touches these columns, so the postgres:16 harness is not required; `supabase db push --remote` applies it.

**D7 — Equip stored by catalog id (`partner_id`), not display name.**
R1999 moved psychubes to a name key because its numeric ids were unstable across regenerations; CZN partner ids are the name's slug, so the id is exactly as stable as the name while staying kebab-safe and matching `partner_preferences`. Both sides in id-space means the match badge rank is `partnerPreferences.indexOf(partnerId)` — no `ALL_*` bridge like AE's `resolveWeaponRank`. `partnerMatch.ts` still exists (returns `number | null`, never throws) so the badge logic is unit-tested in isolation.

**D8 — Picker and preference options = `ALL_CZN_PARTNERS.filter(p => p.class === combatant.class)`, plus the equipped Partner if it fell outside the set.**
User pinned "only matching class" (AE's exact-match contract). The append rule guards against catalog drift (a class respelled upstream) so a stored `partnerId` never renders as a blank select. Label `{name} ({rarity}★)` on both controls so the equip picker and the ranked list read identically (AE precedent).

**D9 — Promote AE's `.weapon-match-badge` to `card.css` as `.pref-match-badge`; AE renames.**
Two games now render the same pill; CLAUDE.md forbids re-declaring shared rules and the Temper work drove component CSS duplication to zero. The rule is pure shape (margin, padding, `xs` bold type, 1px border, `sm` radius) with colour inline, so it is game-neutral. Alternative: a `.partner-match-badge` copy in `CombatantCard.css` (rejected: duplication). Alternative: a React `MatchBadge` component (rejected: a one-span pill does not earn a component; `ScoreBadge` has different semantics). `CardPatterns.stories.tsx` gains the pill.

**D10 — Hook API: `updatePartner(id, patch: CznPartnerPatch)` and `updatePartnerPreferences(id, ids)`; limits in `combatantLimits.ts`.**
`CznPartnerPatch = Pick<CznCombatantPatch, 'partnerId' | 'partnerLevel' | 'partnerEgo'>` (AE `AeWeaponPatch` shape) so the picker, slider, and rung share one callback and one debounced write. `updatePartner` clamps level/ego then `applyPatch`; `updatePartnerPreferences` is `makeFieldUpdater('partnerPreferences', { transform: dedupe })`. `CZN_PARTNER_MAX_LEVEL = 60` and `CZN_PARTNER_MAX_EGO = 4` live beside the combatant caps in the service-free `combatantLimits.ts` so `CombatantCard` tests keep their plain-factory hook mock (CI has no Supabase env in the unit step).

**D11 — Card: summary line + two appended edit sections; existing order untouched.**
`summaryLine` goes from `[]` to the Partner line (name teal / dash dimmed via `getProgressStyle(partnerId ? 1 : 0, 0, 1)`, level coloured by `getProgressStyle(level, 1, 60)`, `T{ego}` coloured by `getProgressStyle(ego, 0, 4)`, then the match pill). Edit body appends **Partner** (`Select` → `LevelSlider` → `SegmentedButtons` with `coloring="investment"`, `EGO_OPTIONS` built from `CZN_PARTNER_MAX_EGO`) and **Preferred Partners** (`PreferenceChain variant="ranked-list"`, `addLabel="+ Add Partner"`). `GameCardShell` measures the edit body, so the ranked list growing is already handled (AE's "edit body grows" requirement is shell-level). `CznPage` passes the two new callbacks; `onEditCommit` already refreshes the projection basis.

**D12 — Docs: `CONTEXT.md` adds the Partner noun to the CZN row and a one-line definition; `CLAUDE.md` `czn` block adds the static-query seam, the minted-slug rule, the partner seed, and `--reupload-partners`.**

## Risks / Trade-offs

- [Static-query hash disappears or the page gains several] → Resolve from `staticQueryHashes` and select by payload shape; abort non-zero naming the endpoint when none matches. Weekly run surfaces it.
- [Prydwen renames a Partner] → Its minted id changes; tracked `partner_id` and preference entries keep the old slug and render as the off-class/unknown append (D8) until the seed pins the old name or the row is re-picked. Accepted: renames are rare and the fallback is visible, not a crash. The run's `removed`/`added` diff makes it obvious in PR review.
- [Level cap 60 or Ego cap 4 is wrong] → Paired slider-max + CHECK; one-line migration to widen, constants in one file. Called out in the spec.
- [Seed `id` typed by hand drifts from `slugify(name)`] → D2 post-validation aborts the run naming the entry.
- [Promoting the match pill touches AE] → CSS class rename only; `OperatorCard.test.tsx` asserts by title/text, not class — verify in the task and add a class assertion to the CZN card test instead.
- [44 extra ImageKit uploads on first run; search-index lag re-uploads a few on the second run] → Known Phase 1 behaviour; third run reports all skipped.

## Migration Plan

1. Apply `supabase/migrations/20261109000001_add_czn_partner_tracking.sql` with `npx supabase db push --remote` before merging; the app tolerates the columns existing early and existing rows take the defaults.
2. Run `node scripts/update-czn-data.mjs` locally to seed `chaos_zero_nightmare/partners` and commit the generated `partners.ts` (plus any combatant diff that run picks up).
3. Merge; Vercel deploys on push to `main`.
4. Rollback: revert the app commit; the columns can stay (nullable / defaulted) — dropping them is a separate migration if ever wanted.

## Open Questions

- Which Partners go into the initial `czn-partners.json` and with what `imageSource` — a data task resolved while implementing task 1.3 from Game8's Partner list, same procedure as the combatant seed.
