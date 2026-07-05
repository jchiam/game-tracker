## Context

P5X is the only game whose lineup feature is labelled "Teams". The wording appears in six source spots (`P5xPage.tsx` view label + subtitle, `PartiesTab.tsx` config nouns, `partyService.ts` default name, `games.ts` description, plus two comments) and in four test files. The internals already use party vocabulary (`useParties`, `partyService`, `PartiesView`), so this is a display-noun alignment, not a structural change.

## Goals / Non-Goals

**Goals:**

- P5X presents its lineup feature as "Party"/"Parties" everywhere user-facing.
- Stale "team" comments and test strings updated to match.
- Change is caught by an updated test asserting the "Parties" label.

**Non-Goals:**

- No change to party CRUD, slot constraints, tier, or favorite behavior.
- No DB migration, no data-pipeline change, no shared-code change.
- Not touching other games' flavor nouns (HSR "Parties", R1999/N2E "Lineups", AE "Squads" stay as-is).

## Decisions

- **View label = "Parties" (plural), config `party` noun = "Party" (singular).** Mirrors HSR exactly, which already pairs `secondViewLabel="Parties"` with `party: 'Party'`. Alternative — "Party" as the view label — rejected as inconsistent with the existing plural-view convention.
- **Pin the P5X display noun in `shared-parties` spec.** The flavor noun was config-only and untested; adding a scenario makes the rename regression-safe. Alternative — leave unspecified — rejected because the rename would have no test guarding it.

## Risks / Trade-offs

- [Missed occurrence leaves "Team" in one spot] → grep `[Tt]eam` across the P5X module + `games.ts` P5X entry after editing; `npm run lint` + `npm test` gate.
- [Existing P5X party rows named "New Team" in prod DB] → cosmetic only; the default name applies to new parties. No data migration warranted.
