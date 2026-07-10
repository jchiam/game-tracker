# Design

## Context

P5X has 4 Heavens Revelation slots (sun/moon/star/sky) whose sets grant 2pc/4pc bonuses, and 1
Space slot with its own single-card set. `ThiefCard` currently summarises only the dominant Heavens
set, losing 2pc+2pc splits and hiding the Space set except at Heavens-4pc. The equip modal and
summary lead with Heavens; the user wants Space first. All changes are display-only — no stored
value moves.

## Goals / Non-goals

**Goals**

- Space first, consistently: equip slots, summary chip, edit readout.
- Show every active set bonus (lossless), names + piece counts only.
- One pure helper feeds both display surfaces.

**Non-goals**

- Scoring (none exists; deferred as a separate decision).
- Effect-text display (user chose names + piece counts).
- Any persistence / schema / hook change.

## Decisions

### D1 — `getRevelationSummary` helper (single source)

A pure function in `revelations.ts`:

```
interface RevelationSetBonus { id: string; name: string; pieces: 2 | 4; }
interface RevelationSummary {
  spaceSet: { id: string; name: string } | null;
  heavensBonuses: RevelationSetBonus[];
}
getRevelationSummary(revelations): RevelationSummary
```

- **Heavens:** group the 4 Heavens slot cards by `setId`; for each set with **≥2** cards emit a
  bonus with `pieces = 4` when exactly 4, else `2` (2 or 3 cards → 2pc — the 3rd card grants nothing
  until the 4th). Single-card sets are omitted. Sort `4pc` before `2pc`, then by set name.
- **Space:** the Space slot's set (if a card with a `setId` is equipped), resolved to `{id, name}`.

Both `ThiefCard` surfaces import this — no duplicated aggregation, and the "dominant only" logic is
deleted.

### D2 — Display order and format (space-first, names + pieces)

Everywhere the summary renders, order is **Space set → Heavens bonuses**.

Heavens bonuses are ordered `4pc → 2pc`, then by set name (ascending), so the sequence is
deterministic — e.g. Peace before Power at equal pieces.

- **Summary chip** (collapsed): a single `StatChip`, parts joined by `·`. The Space set shows its
  bare name; each Heavens bonus shows `{name} {pieces}pc`. Example: `Meditation · Peace 2pc · Power 2pc`.
  Shown when the summary has at least one part; colored via the existing investment gradient (progress
  from the best Heavens bonus: 4pc → full, 2pc → half, space-only → low).
- **Edit readout** (Revelations `ProgressSection`): a per-line list rendered in the section **body**
  (which today holds only the "Edit Revelations" button). Space first, tagged `(Space)`; each Heavens
  bonus on its own line as `{name} {pieces}pc`. The button stays below. The header `value` is
  **omitted when sets are active** (the vertical body readout is the display) and shows `—` when no
  set is equipped — the `.section-header` is a `space-between` row sized for short values, so a long
  one-liner there would squash against the label.

### D3 — Reorder `REVELATION_SLOTS`, not a new array

`REVELATION_SLOTS` has a single consumer (the equip modal's slot map) and load/save use slot keys
directly, so reordering it to `['space', 'sun', 'moon', 'star', 'sky']` is display-only and needs no
new constant. `HEAVENS_SLOTS` stays `['sun', 'moon', 'star', 'sky']` — the consolidation groups over
it, unaffected by the display reorder.

## Risks

- **Low** — display-only. The one subtlety is the 2/3-card breakpoint (3 cards = 2pc, not 4pc);
  covered by a helper unit test. Existing `ThiefCard` chip tests change (dominant → consolidated) and
  are updated as part of the change.
