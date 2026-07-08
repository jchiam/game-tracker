## Context

P5X's Mindscape system is a per-character node tree with stat upgrades, skill
scaling upgrades, and a Bell of Stars unlock. Nodes are too granular and
variable-per-character to track individually. A simple boolean "maxed" captures
the meaningful investment milestone without per-node complexity.

The existing P5X tracked thief has `skillsLeveled` / `roseMaxed` booleans for
skill progress. `mindscapeMaxed` follows the same pattern — a standalone
boolean with no coupling invariant (unlike rose/skills).

## Goals / Non-Goals

**Goals:**

- Track Mindscape completion as a single boolean per thief
- Show maxed indicator on collapsed card summary
- Provide toggle in edit body
- DB column with migration

**Non-Goals:**

- Per-node tracking (too complex, variable per character)
- Ring/tier progress (0–5 integer) — user prefers simple boolean
- Mindscape material tracking
- Any coupling invariant with other fields (standalone boolean)

## Decisions

**Field shape:** Single boolean `mindscapeMaxed`, default `false`. No
coupling with other fields — can be toggled independently.

**Hook updater:** Plain `makeFieldUpdater` — no custom body needed (unlike
skill progress which has coupling logic). Maps to DB column `mindscape_maxed`.

**Card summary:** When `mindscapeMaxed` is `true`, show a `StatChip` with
"MS ✓" text using a maxed-state color (teal end of progress gradient via
`getProgressStyle(1, 0, 1)`). When `false`, show nothing (uncluttered default).

**Card edit:** A "Mindscape" `ProgressSection` below the Skills section with
a single toggle button ("Maxed" label). Uses self-styled toggle (same pattern as
skill toggles), not `.btn`.

**DB migration:** `ALTER TABLE p5x_tracked_thieves ADD COLUMN mindscape_maxed
BOOLEAN NOT NULL DEFAULT FALSE`. No CHECK constraint needed (simple boolean).

## Risks / Trade-offs

- **Coarse granularity:** Loses intermediate progress info. Acceptable — user
  explicitly chose simplicity over detail. Can upgrade to integer later if needed.
- **No material gating logic:** Unlike rose gate, no derived "stuck" state.
  Mindscape is just "done or not done" from a tracking perspective.
