# Design: hsr-split-summary-lines

## Context

`.game-card-static-line` (card.css) is nowrap + ellipsis — a deliberate one-line digest. `GameCardShell` renders its `summaryLine` slot into exactly one such div. The HSR card packs two equipment kinds into it (Light Cone readout + relic set digest); since the cone icon and match badge shipped, the combined content overflows and the relic sets — rendered last — get ellipsized away.

N2E (arc + cartridge) and P5X (revelation sets + persona) pack two kinds into one line too, so the fix belongs at the shell level, not as an HSR CSS hack.

## Goals / Non-Goals

**Goals:**

- HSR cone readout and relic digest each get a dedicated, independently ellipsized summary line.
- Shell change is backward compatible — zero edits in the other four game cards.
- Collapsed card heights stay uniform across the HSR roster grid.

**Non-Goals:**

- Migrating N2E/P5X to the array form (free later; not needed until they overflow).
- Wrapping or multi-line text within a single summary line — each line keeps nowrap/ellipsis.
- Any change to the collapse/measurement mechanics or `card.css`.

## Decisions

1. **Widen the slot type, not add a prop.** `summaryLine: ReactNode | ReactNode[]`; the shell maps an array to one `.game-card-static-line` per entry (positional keys are fine — the list is static per card). A separate `summaryLines` prop was rejected: two props for one job. An HSR-only CSS wrap override was rejected: wrap breaks mid-set-name, loses ellipsis, and violates the no-redeclare rule for shared card rules.
   - Detection note: `Array.isArray` on a ReactNode is safe here because no game passes an array today; after this change an array always means "multiple lines" by contract.
2. **Both HSR lines always render.** Line 1 = Light Cone (icon, name, `Lv`, `S#`, match badge), line 2 = relic sets. Each shows `—`/`.no-equip` (rust) when its kind is absent. A conditionally omitted relic line was rejected: it would break the existing uniform-collapsed-height requirement and make grid rows ragged; positional stability (line 1 is always the cone) also aids scanning.
3. **No height/budget work.** The shell already measures `.game-card-static-summary-inner` scrollHeight into `--game-card-summary-max-height`; the second line raises the measurement automatically. `reserveSummaryRows` only affects the stats chip row — untouched.
4. **No CSS changes.** The canonical `.game-card-static-line` rule applies per line; the summary inner wrapper's existing flex column gap provides line spacing.

## Risks / Trade-offs

- [Both-empty card shows two `—` rows] → Accepted: uniform height and stable line meaning outweigh the slightly redundant dashes; rare state (a tracked character with no cone and no relics).
- [Every HSR card grows ~1 line taller collapsed] → Accepted: uniform across the grid; measured budget absorbs it, no clipping.
- [`Array.isArray` on ReactNode conflates a fragment-as-array intent] → Contract documented in the prop's JSDoc and the shared-ui-components spec; single-node callers unaffected.

## Migration Plan

Single PR: shell widening + Storybook variant + HSR card split + test updates. No data or API changes; rollback is a revert.
