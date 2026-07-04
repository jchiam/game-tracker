## Why

The four party services (`partyService.ts` in hsr / r1999 / n2e / ae — ~480 source LOC + ~1130 test LOC) are ~90% identical: same load-with-members join ordered by `created_at`, same create-or-update save with delete-then-reinsert members, same delete. The differences are pure config (table names, member FK column and camelCase key, default party name, and the R1999/N2E extras `tier` / `is_favorited` + favorite toggle) plus accidental inconsistencies in error semantics: HSR/R1999 swallow errors (`loadParties` returns `[]`, `saveParty` returns `null`) while AE/N2E throw — and nothing in the save chain (`usePartiesBase.saveParty` → `PartiesTab` → `PartyEditorModal`) catches, so an AE/N2E save failure today is an unhandled promise rejection that leaves the editor modal stuck open. The hook layer was already unified (`usePartiesBase` + `makeFavoriteToggle`); this completes the same collapse one layer down, as candidate 4 of the 2026-07-04 architecture review and the direct sibling of the `createRosterPersistence` extraction.

## What Changes

- New `createPartyPersistence(config)` factory in `src/services/rosterPersistence.ts` (the existing shared persistence core), producing `loadParties` / `saveParty` / `deleteParty` / `toggleFavoriteParty`. Config: `partiesTable`, `membersTable`, `defaultName`, `memberFromRow` / `memberToRow` mappers, and optional `extraSelect` / `extraFromRow` / `extraToRow` for game-specific party columns (`tier`, `is_favorited`).
- The four per-game `partyService.ts` files become thin config adapters re-exporting the produced functions under their existing names (R1999/N2E additionally re-export `toggleFavoriteParty`). No hook, page, or component changes.
- Error semantics unified (deliberate):
  - **`loadParties` throws** on DB error (was: HSR/R1999 returned `[]`) — `usePartiesBase` already catches and logs, so visible behaviour is unchanged there, and it matches the roster core's load contract.
  - **`saveParty` returns `null`** on a party-row insert/update error (was: AE/N2E threw) — fixes the unhandled-rejection path; the hook's `if (partyId)` guard already handles `null`.
  - **Member-insert failure is logged and the party id still returned** (HSR/R1999 behaviour) — the party row is already persisted at that point; returning the id triggers the hook's reload so local state reflects true DB state, whereas returning `null` would invite a retry that duplicates the party.
  - **`deleteParty` / `toggleFavoriteParty` return `false`** on error (unchanged — all games already did this).
- Save-row defaults unified: `name: party.name || defaultName`, `notes: party.notes ?? null` (HSR/R1999 previously defaulted notes to `''`; the `notes` type is already `string | null` everywhere). The same row is applied on both create and update, so the AE update path now also applies the name fallback.
- Tests: generic party CRUD behaviour (DB-disabled, load mapping + member sort, create/update flows, error semantics, favorite toggle) covered once in `rosterPersistence.test.ts`; per-game `partyService.test.ts` collapse to config wiring (table names, member column mapping both directions, extras columns, default name, toggle export) using the shared `createBuilder` mock — removing the four local `createBuilder` copies that predate `src/test/mocks/supabase.ts`.

## Capabilities

### Modified Capabilities

- `shared-roster-persistence`: gains the party-persistence factory requirement and extends the per-game-adapter requirement to the party services.

## Impact

- **Modified:** `src/services/rosterPersistence.ts` (+~90 lines), `src/services/rosterPersistence.test.ts` (+party suite), the four `partyService.ts` (each shrinks to a ~25-line adapter), the four `partyService.test.ts` (collapse to config wiring), CLAUDE.md (service-layer description, Known Limitations note that party member replacement shares the non-atomic delete-then-reinsert pattern).
- **Unchanged:** hooks, pages, components, DB schema, e2e flows.
- **Risk:** low — behaviour changes are the deliberate unifications above; the AE/N2E save-failure change is strictly better (no unhandled rejection); the notes `''`→`null` change is type-compatible and only affects newly saved empty notes.
