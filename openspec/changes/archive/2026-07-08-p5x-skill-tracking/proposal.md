## Why

P5X tracked Thieves record only `level`, `awareness`, and `isFavorited` — the thinnest tracking of any game in the app (HSR, R1999, N2E, and AE each track skills and/or gear on top of level). The single biggest untracked per-Thief progression axis is **Persona skill progress**. In-game, a Thief's skills level 1→10, but advancement past level 8 is gated by a rare material ("rose"); most Thieves sit parked at the level-8 incense cap waiting on rose. There is currently no way to record whether a Thief's skills are leveled, and — critically for planning — no way to see which Thieves are rose-bottlenecked (the natural "where do I spend my rose" shortlist).

## What Changes

- Add two boolean fields to the P5X tracked-thief model — `skillsLeveled` (skills brought up to the level-8 incense cap) and `roseMaxed` (pushed past the rose gate 8→10 to max) — mirroring the existing boolean-milestone idiom (HSR `tracesAttained`, AE `skillsMaxed`).
- Derive a **rose-gated** state as `skillsLeveled && !roseMaxed` and surface it on `ThiefCard` as a 🌹 badge in the collapsed summary; the two toggles live in the card's edit body below the existing Awareness row.
- Enforce the invariant that `roseMaxed` cannot be true while `skillsLeveled` is false — at the UI (coupled toggles), the hook updater (reads current state), and the database (`CHECK` constraint) layers.
- New DB migration adds `skills_leveled` and `rose_maxed` columns to `p5x_tracked_thieves` with the `CHECK` guard; service column map, select string, insert defaults, and `fromRow` mapper extend to carry them.
- Skills are tracked as a single **aggregate** per Thief (not per-skill) — no skill catalog is added, and the update script is untouched.
- Superego / S-LVL is explicitly **out of scope**: it is a Wonder-only, account-level concept and Wonder is not a tracked Thief.

## Capabilities

### Modified Capabilities

- `p5x-thief-detail`: Adds aggregate skill-progress tracking (two boolean fields), the derived rose-gated summary badge, the coupled edit-body toggles, and the cross-field invariant. Existing level / awareness / favorite / sort / search / card-composition requirements are unchanged.

## Impact

- **Schema:** new migration `supabase/migrations/YYYYMMDD000000_p5x_add_skill_tracking.sql` — two boolean columns + `CHECK (NOT (rose_maxed AND NOT skills_leveled))` on `p5x_tracked_thieves`.
- **Types:** `P5xTrackedThief` and `P5xThiefPatch` gain `skillsLeveled` / `roseMaxed`.
- **Service:** `thiefService.ts` column map, `select`, `insertDefaults`, `fromRow` extend for the two columns.
- **Hook:** `useThieves.ts` gains a skill-progress updater with the coupling invariant + `createTrackedThief` defaults; optional roster sort/filter for rose-gated.
- **UI:** `ThiefCard.tsx` (+ `.css`) adds the 🌹 rose-gated badge and the two coupled toggles.
- **Tests:** `thiefService.test.ts` (wiring), `useThieves.test.ts` (updater + invariant), `ThiefCard.test.tsx` (badge states + toggles).
- **Docs:** delta spec on `p5x-thief-detail`; no CLAUDE.md change required.
- **Risk:** low — additive fields over an existing pattern; no catalog, no update-script, no party changes.
