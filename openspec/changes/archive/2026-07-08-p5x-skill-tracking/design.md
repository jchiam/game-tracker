## Context

P5X Thieves track only `level` / `awareness` / `isFavorited`. The change adds aggregate skill-progress tracking centred on the in-game **rose gate**: skills level 1→10, but 8→10 needs the rare "rose" material, so most Thieves park at the level-8 incense cap. The tracker's value is not the exact skill number — it is answering _"which Thieves are stuck at 8 waiting on rose?"_, the rose shopping list.

Two design decisions were settled during exploration:

- **Aggregate, not per-skill.** A Thief has ~3 independently-levelling skills, but per-skill tracking would require a skill catalog in `thieves.ts` that the update script does not scrape today. Aggregate matches how progress is reasoned about ("skills done / not done") at zero catalog cost.
- **Two booleans (Model 2), not a single tri-state enum (Model 1).** Both encode the same three reachable states. Two named bools (`skillsLeveled`, `roseMaxed`) extend the existing boolean-milestone idiom (HSR `tracesAttained`, AE `skillsMaxed`) and read self-evidently in a DB row. The tradeoff is one representable-but-invalid combination (`roseMaxed && !skillsLeveled`), guarded at three layers below.

## Goals / Non-Goals

**Goals**

- Record aggregate skill progress per Thief as two booleans.
- Make the rose-bottleneck state (`skillsLeveled && !roseMaxed`) a first-class, visible, filterable signal.
- Make the invalid combination unreachable through the UI and rejected by the DB.
- Reuse existing shared primitives and the boolean-milestone convention.

**Non-Goals**

- Per-skill levels or a skill catalog.
- Weapon, revelation-card, or build-preference tracking (separate future changes / Tiers 2–3).
- Superego / S-LVL (Wonder-only, account-level — not a Thief field).
- Any update-script or party changes.

## Decisions

### State model — three reachable states from two booleans

```
 skillsLeveled  roseMaxed   meaning                     summary chip / badge
 ─────────────  ─────────   ─────────────────────────   ────────────────────
 false          false       untouched                   (no skill badge)
 true           false       at Lv8, rose-gated       ◄  🌹 "rose-gated"
 true           true        maxed (Lv10)                "skills maxed"
 false          true        INVALID                     (unreachable / rejected)
```

### Invariant enforcement — three layers

1. **UI (coupled toggles).** In `ThiefCard`, the two toggles are dependent: enabling `roseMaxed` implies `skillsLeveled`; disabling `skillsLeveled` clears `roseMaxed`. The invalid combo can never be produced by interaction.
2. **Hook updater (reads current state).** A dedicated `updateSkillProgress` updater merges the requested change against current state and normalizes: `roseMaxed → true` forces `skillsLeveled → true`; `skillsLeveled → false` forces `roseMaxed → false`. Per CLAUDE.md this is a state-reading updater (like N2E `awakening`), so it gets a custom body rather than a plain `makeFieldUpdater`. It queues both fields in one patch via the existing debounced save.
3. **Database (`CHECK`).** `CHECK (NOT (rose_maxed AND NOT skills_leveled))` rejects the invalid row as a last line of defense.

### Card composition

- **Collapsed summary:** when `skillsLeveled && !roseMaxed`, render a compact 🌹 rose-gated `GameBadge`/chip alongside the existing Lv / A chips. When `roseMaxed`, an unobtrusive "skills maxed" indicator; when untouched, nothing (keeps the common early-game card clean).
- **Edit body:** a new "Skills" `ProgressSection` below the Awareness section holding the two coupled toggles (`.toggle-btn` self-styled buttons, per the button convention — not `.btn`). Reuse `ProgressSection` for the section header/value, matching Level and Awareness.

### Service / persistence wiring

- `THIEF_COLUMNS` gains `skillsLeveled: 'skills_leveled'`, `roseMaxed: 'rose_maxed'`.
- `select` extends to `..., skills_leveled, rose_maxed`.
- `insertDefaults` gains `skills_leveled: false, rose_maxed: false`.
- `fromRow` maps `skillsLeveled: !!row.skills_leveled`, `roseMaxed: !!row.rose_maxed`.
- No factory change — `createRosterPersistence` already carries arbitrary patch keys.

### Optional roster surfacing

The rose-gated set is the planning payoff. Minimum: the derived badge. Optional (kept small, behind the existing `useRosterView` seam): a "rose-gated" filter or sort so the roster can be narrowed to `skillsLeveled && !roseMaxed`. Marked optional in tasks so the core lands even if the filter is deferred.

## Risks / Trade-offs

- **Invalid-combo representability.** Mitigated by the three-layer guard; the DB `CHECK` is the authoritative backstop.
- **Aggregate loses per-skill fidelity.** Accepted — matches how players reason and avoids a catalog/update-script expansion. Per-skill can supersede later without a data migration loss (bools remain a valid coarse view).
- **Badge noise.** Only the rose-gated state gets a prominent badge; untouched Thieves show nothing, keeping early rosters uncluttered.

## Migration Plan

1. Add migration: two `BOOLEAN NOT NULL DEFAULT false` columns + the `CHECK` constraint on `p5x_tracked_thieves`. Additive; existing rows default to `false/false` (untouched), which is correct.
2. Ship types + service + hook + card together; no backfill needed.
3. No rollback data concern — dropping the columns later is non-destructive to the other tracked fields.

## Open Questions

- Include the optional roster "rose-gated" filter/sort in this change, or defer to a follow-up? (Tasks mark it optional; default is to include the sort if cheap, defer a dedicated filter chip otherwise.)
