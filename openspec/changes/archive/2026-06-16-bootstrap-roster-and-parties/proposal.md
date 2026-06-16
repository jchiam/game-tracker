## Why

The roster and party management patterns are shared across all three games and are the most likely target for future "add a new game" changes. Capturing them as canonical specs now ensures those changes can delta against a solid foundation rather than reading code.

## What Changes

- Create new spec `roster`: entity tracking lifecycle — load from DB, add/remove with optimistic updates, in-flight dedup, search (Fuse.js fuzzy), sort (favorited-first + secondary + alpha)
- Create new spec `parties`: party CRUD (create, edit, delete), slot management, reload-after-save flow, optimistic delete, favorite toggling (R1999/N2E only), tier field (R1999/N2E only)

No application code is changed. This is documentation only.

## Capabilities

### New Capabilities

- `roster`: Shared entity tracking lifecycle used by all game hooks via `useRoster`. Covers DB load, optimistic add/remove, in-flight insert dedup, Fuse.js search, and favorited-first sort.
- `parties`: Shared party lineup management used by all game hooks via `useParties`. Covers CRUD, slot constraints, reload-after-save, optimistic delete, and game-specific extensions (tier, favorite toggle).

### Modified Capabilities

None — no existing specs exist yet for these capabilities.

## Impact

- `src/hooks/useRoster.ts` — source for `roster` spec
- `src/hooks/useParties.ts` — source for `parties` spec
- `src/hooks/honkai-star-rail/useParties.ts` — HSR-specific party wiring (no tier/favorite)
- `src/hooks/reverse1999/useParties.ts` — R1999-specific party wiring (tier + favorite)
- `src/hooks/neverness-to-everness/useParties.ts` — N2E-specific party wiring (tier + favorite)
- `src/services/*/partyService.ts` — slot constraint source of truth per game
