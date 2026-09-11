# Network Load Performance

## Why

Loading a game page felt slow. A review of every network call the app makes found the cost concentrated in a few places: every RLS policy re-evaluated `auth.uid()` per row (and child-table policies join back to the parent per row on top), `hsr_relic_substats.relic_id` was the one FK child column with no index, the first Supabase and ImageKit requests paid DNS + TLS on the critical path, card mugshots were served at source resolution (R1999 ~148 KB each), and every multi-row write ran as a sequence of 2–5 dependent round trips with no transaction — the long-documented "non-atomic saves" limitation. Measured from a nearby region, a warm Supabase round trip is ~180 ms; a single Target Build save was five of them.

## What Changes

- **RLS policies evaluate `auth.uid()` once per statement.** A migration rewrites every public policy in place to the `(select auth.uid())` form via `ALTER POLICY` over `pg_policies`, and adds the missing `hsr_relic_substats(relic_id)` index.
- **Preconnect hints** for the Supabase and ImageKit origins in `index.html`, substituted from the `VITE_*` env at build time.
- **Card mugshots capped at 480 px without upscaling** — `getMugshotUrl` / `getPersonaMugshotUrl` chain `w-480,c-at_max` after the square crop; the card header `<img>` gains `loading="lazy"` and `decoding="async"`.
- **Every multi-row write is one atomic RPC.** Three `SECURITY INVOKER` plpgsql functions — `replace_preference_rows`, `upsert_equipment_slot`, `save_party` — replace the client-side call sequences. Table and column names travel as data (the shapes are shared across games) and pass an `assert_game_table` allowlist plus `%I` quoting. Clients keep their existing option shapes; a new shared `upsertEquipmentSlot` helper joins `savePreferenceRows` in `rosterPersistence.ts`, and `upsertRelic` / `upsertDisc` become config adapters over it.
- **BREAKING (internal contract)**: `PartySaveResult` drops `membersSaved` — an atomic save has no "row saved, members did not" state — and the party hook drops the matching warning toast.
- **`user_profiles` rows are provisioned by an `AFTER INSERT` trigger on `auth.users`** (with a backfill) instead of an unchecked upsert before every tracked-entity insert.
- The "non-atomic saves" Known Limitation is retired; in its place CLAUDE.md documents that RPC atomicity is verified by applying the full migration history to a throwaway `postgres:16` container, since the mocked unit tests only assert RPC payloads.

## Capabilities

### Modified Capabilities

- `shared-roster-persistence`: insert is a single call (profile provisioned by trigger); `savePreferenceRows` is one atomic RPC; new shared `upsertEquipmentSlot` helper and RPC; `saveParty` is one atomic RPC and `PartySaveResult` is `{ partyId }`.
- `shared-parties`: save resolves `{ partyId }`; "saved without members" outcome removed.
- `shared-save-behaviour`: the non-atomic preference-save limitation is replaced by an atomic-RPC requirement.
- `shared-image-pipeline`: mugshot transform chains a 480 px width cap with no upscale.
- `hsr-character-detail`, `n2e-character-detail`, `p5x-revelation-preferences`, `zzz-agent-detail`, `ae-operator-detail`: references to the delete-then-reinsert limitation updated to the atomic RPC.

## Impact

- **Migrations**: `20260911000000` (index) through `20260911000005` (profile trigger). The trigger migration touches `auth.users` and needs owner privileges to apply.
- **Modified**: `src/services/rosterPersistence.ts` (+ tests), `src/services/honkai-star-rail/characterService.ts`, `src/services/zenless-zone-zero/agentService.ts` (+ tests), four per-game preference-save test files, six per-game `partyService.test.ts`, `src/hooks/useParties.ts` (+ tests), `src/types.ts`, `src/lib/imagekit.ts` (+ test), `src/components/GameCardShell.tsx`, `index.html`, every test/story that stubbed `PartySaveResult`.
- **Docs**: `CLAUDE.md` (service-layer paragraph, Known Limitations), `CONTEXT.md` (Roster Persistence, Preference Rows, new Equipment Slot, Party Persistence Factory and error semantics).
- **No new tokens, no CSS changes, no new external domains.**
