## Context

The P5X `ThiefCard` renders equipped revelation set names inside a summary `StatChip`
(`.p5x-revelation-chip`), built from `getRevelationSummary(thief.revelations)`. Because
the label varies with set names (`Meditation · Power 2pc · Peace 2pc`), the chip needs a
`max-width` (18ch, 12ch under 768px) plus `white-space: nowrap` + `text-overflow: ellipsis`
to stop the widest label from pushing the chip row onto a third line — which truncates real
information on the collapsed card.

HSR's `CharacterCard` never does this: its chips are set-independent counts (`Relics 4/6`),
and the variable set-name text lives on the free `summaryLine` (rendered below the fixed
two-line chip reserve, so it can wrap without affecting the reserved chip height). This change
brings P5X to the same pattern. P5X's `summaryLine` currently holds only the bound-Persona
name, so the set text must **share** that line while staying visually distinct from it.

Scope is one component + its CSS + its test. No data/service/hook/persistence changes;
`getRevelationSummary` is reused unchanged.

## Goals / Non-Goals

**Goals:**

- Revelation summary chip width is fixed and set-independent (`Rev {n}/5`), colored by the same revelation-match-score gradient it uses today.
- Equipped set names render untruncated on the `summaryLine`, joined with the Persona name but visually distinguishable from it.
- Delete the `.p5x-revelation-chip` width-cap CSS entirely.
- Preserve the fixed two-line collapsed-summary reserve (uniform grid height).

**Non-Goals:**

- Changing summary chip ordering (Level → Awareness → Weapon → Mindscape → Revelations → Skills stays).
- Changing the revelation scoring, `getRevelationSummary` helper, editor modal, slot grid, or Target Build readout.
- Adding a second free line under the chips (the reserve grants one `summaryLine`; sets and Persona share it).

## Decisions

**Chip label = `Rev {n}/5` (count of equipped cards).** Mirrors HSR's `Relics {n}/6`. `n` =
`REVELATION_SLOTS.filter((s) => thief.revelations[s]?.setId).length` — the existing
`hasAnyRevCard` predicate already computes the boolean form; the count is the same filter's
length. The chip renders when `hasAnyRevCard` (≥1 card), matching P5X's "hide chips on untouched
cards" convention. Alternative — always render `Rev 0/5` like HSR — rejected: P5X deliberately
hides zero-investment chips (weapon/mindscape/skills) to keep early cards clean; the revelation
chip should follow suit.

**Chip color unchanged.** Still `revPs` = `getProgressStyle(score, 0, 100)` when score ≥ 0,
else `getProgressStyle(topHeavensPieces, 0, 4)`. The count chip and the summaryLine set text
share this color so they read as one revelation signal.

**Set names move to `summaryLine`, sharing the line with the Persona name.** The `summaryLine`
slot renders: `[set summary][divider][persona]`. Visual distinction:

- Set text: `.rev-set-summary`, inline `color: revPs.color` (score gradient), normal weight, not italic — reads as an investment/equipment signal, same hue as the chip.
- Persona: existing `.persona-line` (italic, `opacity: 0.75`) — unchanged.
- Divider: `.summary-divider` glyph `|` (not `·`, which the set list uses internally), dimmed via `opacity`. Rendered only when set text is present.

Order = set summary first, then Persona — the set text is the equipment signal (HSR's summaryLine
content), Persona is trailing flavor context. When no active bonus (`hasRevSets` false), only the
Persona name renders (no divider), identical to today's behavior.

**`hasRevSets` gates the set text; `hasAnyRevCard` gates the chip.** These already exist in the
component. A lone single card (no 2pc bonus, no Space set) yields `hasAnyRevCard = true`,
`hasRevSets = false` → `Rev 1/5` chip shown, Persona-only summaryLine. Consistent and intentional.

**CSS: delete both `.p5x-revelation-chip` blocks** (base + `@media (max-width: 768px)`), add
`.rev-set-summary` (non-italic; color comes inline from `revPs`) and `.summary-divider` (dim). Per
the token-first rule, any opacity/color that isn't inline uses existing tokens; the score color is
supplied inline from `getProgressStyle` exactly as the chips already do.

## Risks / Trade-offs

- **[Set text + Persona could crowd a narrow card and wrap to two lines on the summaryLine.]** → The summaryLine sits _below_ the fixed two-line chip reserve (like HSR's), so its own wrapping does not disturb the reserved chip height or the uniform-grid guarantee. A long set-summary + long Persona wrapping to two lines is acceptable (matches HSR, where the set line already wraps freely) and no longer clips information.
- **[Losing the standalone chip label changes existing tests.]** → `ThiefCard.test.tsx` assertions on the old chip label move to (a) the `Rev {n}/5` chip and (b) the summaryLine set text. Covered in tasks.
- **[Ordering rationale in the spec previously leaned on the chip being "variable-width."]** → Ordering is unchanged behaviorally; the spec's rationale text is updated to drop the variable-width justification. No code impact.

## Migration Plan

Pure front-end render change; no schema or persisted-data impact. Ships in one commit. Rollback =
revert the commit. No feature flag needed.
