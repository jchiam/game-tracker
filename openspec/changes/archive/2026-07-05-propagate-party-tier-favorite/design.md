## Context

The party view is a shared module (`src/components/parties/PartiesView.tsx`, `PartyCard.tsx`, `PartyEditorModal.tsx`) driven by a per-game `PartyViewConfig`. Tier and favorite are already fully implemented in that shared layer and gated purely by config:

- `PartyCard` renders the tier banner only when `config.supportsTier && party.tier`, and the favorite star only when an `onToggleFavorite` callback is passed.
- `PartyEditorModal` renders the tier `SegmentedButtons` and includes `tier` in the save payload only when `config.supportsTier`.

R1999 and N2E enable both through:

1. A DB migration adding `tier TEXT` and `is_favorited BOOLEAN NOT NULL DEFAULT FALSE` to the parties table.
2. `partyService.ts` supplying `extraSelect: 'tier, is_favorited'`, `extraFromRow`, `extraToRow: (party) => ({ tier: party.tier ?? null })` (favorite deliberately excluded from `extraToRow`), and re-exporting `toggleFavoriteParty`.
3. `useParties.ts` calling `makeFavoriteToggle(setParties, partiesRef, apiToggleFavorite)`.
4. `PartiesTab.tsx` config setting `supportsTier: true` / `supportsFavorite: true` and threading `onToggleFavorite`.
5. The page passing the hook's `toggleFavoriteParty` to the tab.

HSR and AE lack all five. The `shared-parties` spec currently encodes this restriction as "R1999 and N2E only" and explicitly excludes HSR.

## Goals / Non-Goals

**Goals:**

- HSR "Party" and AE "Squad" cards gain the same tier banner + favorite star as R1999/N2E.
- Achieve this by copying the established R1999 config pattern verbatim — no new abstractions.
- Zero changes to shared `PartiesView` / `PartyCard` / `PartyEditorModal` / `party.css`.

**Non-Goals:**

- Changing game-specific nouns (HSR stays "Party", AE stays "Squad"). Only tier/favorite behaviour propagates.
- Fixing the pre-existing non-atomic party-member replacement (out of scope; unchanged).

## Decisions

**Copy the R1999 pattern verbatim rather than hoist tier/favorite into the shared factory default.**
The `extras` seam and `makeFavoriteToggle` helper already exist precisely for this. Making tier/favorite a factory default would force HSR/AE-specific opt-out logic and change behaviour for games that may later want to opt out; per-game config is the established, lower-risk idiom. Alternative (shared default) rejected: larger blast radius, contradicts the existing per-game config convention.

**Favorite is excluded from `extraToRow`, written only via `toggleFavoriteParty`.**
Mirrors R1999/N2E: the editor payload never carries `isFavorited`, so writing it in the normal party update would reset a favorited party on every edit. Copy the R1999 comment verbatim.

**Two separate migrations per game, mirroring R1999's two files.**
`tier TEXT` (nullable, no default) and `is_favorited BOOLEAN NOT NULL DEFAULT FALSE` as independent `ALTER TABLE` statements. Matches existing migration granularity and the R1999 precedent (`20260417000000`, `20260417000001`). New timestamps for HSR and AE tables.

**Override AE's Phase-1 "lighter card" scope — drop the `endfield` variant entirely.**
Per explicit user decision, AE adopts the full R1999/N2E party design, not just the tier/favorite features. The lighter `endfield` variant (flat card, reduced padding, fixed 56px avatars) is what made AE squads look cramped and off next to R1999/N2E lineups, so `variantClass: 'endfield'` is removed from the AE config and the now-dead `.endfield` override rules are stripped from `PartiesTab.css`. AE squads now render the canonical `party.css` card — same padding, backdrop blur, full-width accent-bordered avatars — identical to R1999/N2E. The `PartyViewConfig.variantClass` seam remains for any future game-specific override but is currently unused.

## Risks / Trade-offs

- **Production schema migration on live `hsr_parties` / `ae_parties` tables** → `is_favorited` has a `NOT NULL DEFAULT FALSE`, so existing rows backfill safely; `tier` is nullable. Both are additive, non-breaking. Standard migration review still applies.
- **AE flat-card visual with new tier banner** → Low risk; banner + star reuse existing `party.css` styles proven on R1999/N2E. If it reads poorly, the fix is one config flag, not a rollback.
- **Spec previously asserted "HSR SHALL NOT have tier/favorite"** → The delta explicitly MODIFIES both requirements to include all games, so the archived spec stays coherent.

## Migration Plan

1. Add and apply the four migrations (2 per game) — additive columns, no data migration.
2. Ship service/hook/config/page wiring together with the migrations.
3. Rollback: revert the code; the added columns are inert if unused (safe to leave or drop in a follow-up).
