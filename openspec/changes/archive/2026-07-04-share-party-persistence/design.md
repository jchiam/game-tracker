## Context

Candidates 1–3 (archived 2026-07-04) established the pattern: shared core + thin per-game config adapters, per-game tests covering only the config. Candidate 4 applies it to the last quadruplicated service surface — the party services. The party _hook_ layer is already shared (`usePartiesBase` + `makeFavoriteToggle` in `src/hooks/useParties.ts`); only the service layer still repeats.

## Goals / Non-Goals

**Goals**

- One implementation of party load / save / delete / favorite-toggle against Supabase.
- Per-game files reduced to declarative config (tables, default name, member mappers, extras).
- Unified, hook-compatible error semantics — in particular, kill the AE/N2E unhandled-rejection path on save failure.
- Per-game party tests collapse to config wiring on the shared `createBuilder` mock.

**Non-Goals**

- No hook or UI changes — `usePartiesBase`'s `PartyConfig` contract (`loadParties(userId)`, `saveParty(userId, party)`, `deleteParty(partyId)`) is the fixed interface.
- No atomicity fix for the delete-then-reinsert member replacement (same known limitation as `savePreferenceRows`; documented, single future fix site per pattern).
- No schema changes.

## Decisions

### Decision 1: Factory lives in `rosterPersistence.ts`, not a new file

`rosterPersistence.ts` is already the shared service-persistence core (roster factory + `savePreferenceRows`), is documented as such in CLAUDE.md's Key Files, and owns the single `DB_ENABLED` flag. A separate `partyPersistence.ts` would duplicate that flag and split "shared persistence" across two files for ~90 lines of code.

### Decision 2: Core owns the base party shape; extras are a config seam

All four parties share `id / profileId / name / notes / createdAt / members`; the factory maps those directly and merges `extraFromRow(row)` (R1999/N2E: `tier`, `isFavorited`) on load, and spreads `extraToRow(party)` into the save row. This mirrors the roster factory's `extras` seam and keeps HSR/AE configs to five fields. Per-game `extraToRow` preserves each game's exact write behaviour — R1999 writes `is_favorited: party.isFavorited ?? false` on every save (its pre-existing behaviour), N2E writes only `tier`.

### Decision 3: Error semantics — load throws; writes return null/false; member failure returns the id

- `loadParties` **throws** (log + rethrow), matching the roster core; `usePartiesBase` already wraps its load in try/catch.
- `saveParty` **returns `null`** on a party-row error. Throwing (AE/N2E today) propagates through `usePartiesBase.saveParty` (no catch) into `PartiesTab`'s `onSave` closure (no catch) — an unhandled rejection with the modal stuck open. The hook's `if (partyId)` truthy guard is the designed failure channel.
- A **member-insert failure logs and still returns the party id**: the party row is already committed, so returning the id makes the hook reload and display true DB state; returning `null` would suppress the reload and invite a retry that creates a duplicate party.
- `deleteParty` / `toggleFavoriteParty` return `false` on error — unchanged, and `makeFavoriteToggle` reverts on `false`.

### Decision 4: `toggleFavoriteParty` always produced, selectively re-exported

The toggle is generic (`update { is_favorited: value }` on the parties table — the column name is a fixed DB convention). The factory always returns it; only R1999/N2E re-export it, preserving each game's public service surface. HSR/AE gain no dead export.

### Decision 5: Uniform member select via `membersTable ( * )`

HSR previously selected explicit member columns; AE/N2E used `(*)`. The factory uses `${membersTable} ( * )` with `memberFromRow` picking the fields — one fewer config knob, and member tables are three columns wide.

### Decision 6: Test split follows candidates 1–3

Generic factory behaviour (DB-disabled early returns, load mapping + member slot sort + created_at ordering, create vs update flows, empty-members skip, all error paths, toggle) is tested once in `rosterPersistence.test.ts` against a synthetic config. Per-game suites assert only config wiring: correct tables queried, member row mapping both directions (FK column ↔ camelCase key), extras columns (R1999/N2E), default party name, and toggle export presence. Per-game suites switch from their local `createBuilder` copies to the shared `src/test/mocks/supabase.ts` one.

## Risks / Trade-offs

- **Notes default `''` → `null`** (HSR/R1999): type-compatible (`notes: string | null`), affects only newly saved parties with empty notes; UI already renders null notes (AE/N2E always produced them).
- **HSR/R1999 `loadParties` now throws instead of returning `[]`**: only caller is `usePartiesBase`, which catches; no visible change.
- **AE update path now applies `name || defaultName` fallback**: previously passed `name` through raw; callers always supply a name from the editor modal, so no practical change.
