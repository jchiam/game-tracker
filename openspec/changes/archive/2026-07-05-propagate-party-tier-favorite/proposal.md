## Why

The party/lineup view is already shared across all four games via `PartiesView`, but two features — the user-assigned **tier banner** (S+/S/A/B) and the **favorite star** — are wired up only for R1999 and N2E. HSR and AE render the same card without them, an inconsistency that is purely a matter of unset config flags and two missing DB columns, not a design gap. R1999/N2E is the intended de-facto party design; HSR and AE should match.

## What Changes

- HSR parties and AE squads gain an optional **tier** field (S+/S/A/B), editable in the party editor and shown as a banner on the party card — identical to R1999/N2E.
- HSR parties and AE squads gain a **favorite toggle** (star), persisted per party and reverting optimistically on failure — identical to R1999/N2E.
- Game-specific nouns are **unchanged**: HSR stays "Party", AE stays "Squad". Only the tier/favorite behaviour propagates, not the vocabulary.
- Overrides AE's intentional Phase-1 "lighter card" scope — AE now carries the full tier + favorite feature set.
- No new components and no new CSS: the tier banner and favorite-star styles already live in `party.css`; this change only flips config flags and adds the backing DB columns/service/hook wiring by copying the existing R1999 pattern.

## Capabilities

### New Capabilities

<!-- none — this extends existing party behaviour -->

### Modified Capabilities

- `shared-parties`: The "Party favorite toggle" and "Party tier field" requirements currently restrict tier and favorite to R1999 and N2E and explicitly exclude HSR. Both requirements change to include HSR and AE, making tier + favorite available to all four games.

## Impact

- **DB schema**: two new migrations — add `tier TEXT` and `is_favorited BOOLEAN NOT NULL DEFAULT FALSE` to `hsr_parties` and `ae_parties` (mirrors the existing R1999 migrations).
- **Service layer**: `src/services/honkai-star-rail/partyService.ts` and `src/services/arknights-endfield/partyService.ts` gain `extraSelect`/`extraFromRow`/`extraToRow` and export `toggleFavoriteParty`.
- **Hook layer**: `src/hooks/honkai-star-rail/useParties.ts` and `src/hooks/arknights-endfield/useParties.ts` wire `makeFavoriteToggle` and expose `toggleFavoriteParty`.
- **Page/config layer**: HSR and AE `PartiesTab.tsx` set `supportsTier: true` / `supportsFavorite: true` and thread an `onToggleFavorite` prop; `HonkaiStarRailPage.tsx` and `ArknightsEndfieldPage.tsx` wire the hook toggle to the tab.
- **Tests**: service tests (extras mapping + toggle), PartiesTab config-wiring tests, hook favorite-toggle tests.
- No change to shared `PartiesView`, `PartyCard`, `PartyEditorModal`, or `party.css` — they are already fully config-gated.
