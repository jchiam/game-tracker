## Context

The tracker models three hoyoverse-style Set/Main/Sub equipment editors (HSR relics, N2E
cartridges, P5X revelations) over shared primitives. A single spec requirement
("Equipment editors share labeled, set-gated stat controls") drove all three to enforce a
**substats-exclude-main** invariant: the equipped main stat is removed from the substat option
list (`SubStatList` `excludeValues`), pruned on main-stat change, and removed from the achievable
substat pool in scoring (`achievableSubSum`).

That invariant is correct for HSR relics and P5X revelations, where a piece's main stat is
genuinely excluded from its own sub-roll pool. It is **incorrect for N2E**: cartridge main and
sub stats roll independently, and the same stat (e.g. `Cycle Intensity`, `ATK%`) legitimately
appears as both main and sub on one cartridge. The tracker currently blocks these legal builds.

N2E's stat pools already reflect the overlap — `CARTRIDGE_MAIN_STATS` and `CARTRIDGE_SUB_STATS`
share seven stats — so the only thing forbidding the collision is the copied exclusion logic.

## Goals / Non-Goals

**Goals:**

- N2E cartridge editor offers the equipped main stat as a selectable substat and never prunes a
  substat that equals the main.
- N2E cartridge scorer treats main-as-sub as legal: the achievable substat pool no longer removes
  the equipped main stat.
- HSR and P5X behavior is byte-for-byte unchanged.

**Non-Goals:**

- No change to the game-agnostic scoring core (`achievableSubSum` still excludes exactly the stats
  it is passed; only the N2E adapter's argument changes).
- No change to substat sibling dedupe (sub == sub stays illegal everywhere).
- No change to the N2E main-gating (substats stay gated behind main selection) — kept for user
  flow, not exclusion.
- No data migration; existing stored collisions simply stop being pruned.

## Decisions

**Decision: Carve N2E out at the two call sites, not by branching shared code.**
`SubStatList` and `achievableSubSum` are already parameterized (`excludeValues` prop, `excludedStats`
argument). N2E already passes the main stat into both; the change is to pass an empty exclusion
instead. No shared component gains a game flag.

- `CartridgeEditorModal.tsx`: drop `excludeValues={currentMainStat ? [currentMainStat] : []}` (omit
  the prop, so no main-based exclusion; sibling dedupe remains automatic inside `SubStatList`), and
  drop the `cartridgeSubStats: v ? currentSubStats.filter((s) => s !== v) : currentSubStats` prune
  in the main-stat `onChange` (keep `currentSubStats` untouched).
- `cartridgeScoring.ts`: pass `[]` instead of `c.cartridgeMainStat ? [c.cartridgeMainStat] : []` to
  `achievableSubSum`.

_Alternative considered_: add a per-game `allowMainAsSub` flag to `SubStatList` and the scorer.
Rejected — the primitives are already exclusion-agnostic; a flag would add surface for zero benefit.

**Decision: Keep the N2E main-gate; correct only its comment.**
The comment at `CartridgeEditorModal.tsx:60-62` justifies the substat gate with "a substat can
never equal or precede the main choice." That rationale is now false, but the gate itself is kept
for consistent user flow (pick a main before entering substats). Only the comment changes to state
the flow rationale.

**Decision: Scoring stays sound with main allowed in the pool.**
With the main no longer excluded, a perfect legal N2E item's `achievableSubSum` may now include the
main-as-sub contribution, so the achievable denominator grows appropriately. The existing
`Math.min(total, achievable)` clamp in the core still holds, so no over-100 scores. This matches the
proposal's confirmed intent.

## Risks / Trade-offs

- **Risk: a shared-primitive regression could leak into HSR/P5X.** → Mitigation: the change touches
  only N2E call-site arguments; HSR (`relicScoring.ts`, `RelicEditorModal.tsx`) and P5X files are
  not edited. Spec scenarios assert HSR/P5X still exclude and N2E does not.
- **Risk: scoring numbers shift for existing N2E rosters.** → Accepted and intended: previously the
  denominator ignored a legal main-as-sub option; scores now reflect the true achievable build.
- **Trade-off: sub-gate rationale diverges from exclusion.** → Accepted; documented in the comment
  and spec so future readers don't re-introduce the exclusion to "justify" the gate.
