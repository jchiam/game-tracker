## Context

This change introduces no code modifications. It bootstraps canonical main specs for the two shared management patterns — roster entity tracking and party lineup management — used identically across all three game modules (HSR, R1999, N2E). These are the most reused patterns in the codebase; any "add a new game" change will delta against these specs first.

## Goals / Non-Goals

**Goals:**
- Capture `useRoster` behaviour as a testable spec: load, add, remove, search, sort
- Capture `useParties` behaviour as a testable spec: CRUD, slots, optimistic delete, reload-after-save
- Document game-specific party extensions (tier, favorite) as additive constraints on the shared spec

**Non-Goals:**
- Changing any application code
- Speccing game-specific entity detail (relic scoring, cartridge prefs, etc.) — those are proposals 3–5
- Speccing the DB schema or migration conventions — those are in CLAUDE.md

## Decisions

**One spec for roster (shared), one spec for parties (shared + per-game extensions noted)**
The `useRoster` and `useParties` hooks are generic — they work identically for all games. Game-specific extensions (R1999/N2E tier + favorite on parties) are documented as constraints within the `parties` spec rather than as separate per-game specs. This keeps the "add a new game" delta surface minimal.

**Parties: save = write then reload, not optimistic**
Unlike roster adds, party saves reload from DB after write. This is intentional (party members can be reordered; server is source of truth for slot ordering). Documented explicitly so future changes don't inadvertently switch to optimistic save.

**Parties: delete IS optimistic**
Party delete removes from local state immediately, unlike save. Documented alongside save to make the asymmetry explicit.

## Risks / Trade-offs

- Per-game slot constraints (0–3 for all three games currently) may diverge if a new game has different slot counts → the spec notes current constraints per game and requires a delta spec when adding a new game.
- `useParties` has no retry-on-load-failure (unlike `useRoster`) → documented as a known asymmetry, not a bug.

## Open Questions

None — all behaviour is already shipped and observable in the code.
