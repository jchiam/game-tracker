## Why

The Arknights: Endfield operator card already has the canonical collapse structure (static summary ⇄ edit body behind the ✎ toggle), but it never adopted the shared **investment color language** the other three games use. Its summary chips render in flat default text, its level slider uses a hardcoded `var(--color-brand-primary)` fill via the non-canonical `.character-slider` class (whose CSS lives in N2E's route-split stylesheet and isn't even imported by AE — so the AE slider is effectively unstyled on a cold AE load), and it relies on the default collapse height budgets instead of budgets sized to its actual (very short) content. This is the last card left to align with the cross-game collapse pattern.

## What Changes

- **Color the summary stat chips by investment level** using the shared `getProgressStyle(value, min, max)` gradient (rust → teal). `Lv` chip over 1–90, `P` chip over 0–5 — matching HSR/R1999/N2E, which color their chips by investment.
- **Switch the level slider to the canonical `.level-slider`** class (from `controls.css`, globally available) and drive its thumb fill/glow via `--slider-fill-color` / `--slider-fill-glow` from the same gradient. Removes AE's dependency on N2E's `.character-slider` rule. The slider track fill keeps AE's existing `(level − 1) / 89` formula, which already matches `getProgressStyle`'s normalization so fill % and gradient color stay in sync.
- **Set explicit inline collapse height budgets** on the card root (`--game-card-summary-max-height` / `--game-card-edit-max-height`) sized to AE's real content — a single chip row and a two-section edit body — instead of inheriting the generous shared defaults (200px / 1200px), which make the expand transition animate well past the actual content height.
- **No gear one-liner.** AE operators have no equippable gear (only `level` + `potential`), so there is no `.game-card-static-line` equip digest — unlike HSR/N2E. This is stated explicitly so the omission is intentional, not an oversight.
- **Rarity stars stay as-is** (out of scope). Rarity is an intrinsic property, not an investment level, so the rust→teal gradient deliberately does not apply to the `rarity-indicator`.

## Capabilities

### Modified Capabilities

- `endfield-operator-detail`: Add a presentation requirement for the operator card's collapsed-summary composition — gradient-colored investment chips, canonical level slider driven by the shared gradient, and explicit absence of a gear one-liner. Data-field requirements (level, potential, favorite, sort, search) unchanged.
- `shared-card-collapse`: AE moves from "uses the shared defaults / sets no override" to setting its own inline height budgets, sized to its short content. Updates the per-game-budget guidance that currently cites AE as the defaults-only example.

## Impact

- **Modified:** `src/pages/arknights-endfield/components/OperatorCard.tsx` (gradient chips, canonical slider, inline budgets), `OperatorCard.css` (remove the stale dependency on `.character-slider`; no structural collapse rules added), `OperatorCard.test.tsx` (assertions for the new slider class / chip styling if covered).
- **No DB, service, hook, type, or data-catalog changes.** No new tokens (reuses existing `getProgressStyle` + `.level-slider`).
- **Builds on:** the completed `extract-shared-progress-gradient`, `canonical-card-collapse-classes`, `hsr-card-collapse`, and `slim-n2e-summary` changes.
- **Out of scope:** rarity-star styling, the badge row, the potential-button row visuals, and any AE data-model change.
- **Note:** N2E still legitimately uses `.character-slider`; that rule is left untouched.
