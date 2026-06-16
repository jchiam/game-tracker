## Why

The project has no formal source-of-truth specs. Existing behaviour lives only in code and CLAUDE.md. This bootstrap captures the shared infrastructure layer — auth, save behaviour, and image pipeline — as canonical OpenSpec specs so future changes can delta against them rather than against prose documentation.

## What Changes

- Create new spec `shared-auth`: Google OAuth sign-in/sign-out via Supabase, session lifecycle, auth-gating UI behaviour
- Create new spec `save-behaviour`: `usePendingSaves` debounced write queue, optimistic updates with rollback, beforeunload guard
- Create new spec `image-pipeline`: ImageKit CDN URL resolution, local path fallback, per-entity transform functions

No application code is changed. This is documentation only.

## Capabilities

### New Capabilities

- `shared-auth`: Authentication flow — Google OAuth via Supabase, session management, and auth-gate rendering rules
- `save-behaviour`: Debounced save queue — 1000 ms debounce, optimistic state, rollback on DB failure, unsaved-changes guard
- `image-pipeline`: Image URL resolution — ImageKit CDN transforms for mugshots/avatars/portraits, local `/assets/` fallback

### Modified Capabilities

None — no existing specs exist yet.

## Impact

- `src/hooks/useAuth.ts` — source for `shared-auth` spec
- `src/hooks/usePendingSaves.ts` — source for `save-behaviour` spec
- `src/lib/imagekit.ts` — source for `image-pipeline` spec
- `src/components/AuthGate.tsx` — referenced by `shared-auth` spec
- `src/components/SavingToast.tsx` — referenced by `save-behaviour` spec
