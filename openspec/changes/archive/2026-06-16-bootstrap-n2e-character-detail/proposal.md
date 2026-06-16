## Why

Documenting existing N2E character-detail behaviour as canonical specs. Enables spec-driven delta workflow for future N2E changes, consistent with already-specced HSR and R1999 modules.

## What Changes

- Extract per-character tracked fields (level, awakening, resonance, arc, cartridge, cartridge preferences, favorite) into a formal spec
- Extract cartridge scoring algorithm (main/sub stat matching, grade thresholds) into a separate spec, mirroring HSR relic scoring

## Capabilities

### New Capabilities
- `n2e-character-detail`: Per-character tracked fields — level (1–90), awakening (6 boolean slots), resonance count (0–6), arc equipment (id + level + tier 1–5), cartridge (rarity B/A/S + level 0–20 + main stat + sub stats up to 4), cartridge preferences (main stats chain + sub stats chain + comments), favorite toggle, sort by level, search keys (name, esperType, arcType, roles)
- `n2e-cartridge-scoring`: Cartridge evaluation algorithm — 0–100 score with main stat weight 0.4 + sub stat weight 0.6, stat match rules (exact/partial/cross-crit), grade thresholds (S/A/B/C/D)

### Modified Capabilities

## Impact

Documentation only — no code changes. Creates `openspec/specs/n2e-character-detail/spec.md` and `openspec/specs/n2e-cartridge-scoring/spec.md`.
