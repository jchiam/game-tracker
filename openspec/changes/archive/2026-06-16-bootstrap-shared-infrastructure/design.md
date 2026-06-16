## Context

This change introduces no code modifications. It bootstraps the `openspec/specs/` directory with canonical main specs extracted from existing production behaviour. The three capabilities — auth, save behaviour, and image pipeline — are shared across all game modules and are therefore the highest-value specs to establish first.

## Goals / Non-Goals

**Goals:**

- Capture existing behaviour faithfully as testable specs
- Establish the main spec format so future changes can delta against it
- Cover the three shared infrastructure capabilities: `shared-auth`, `save-behaviour`, `image-pipeline`

**Non-Goals:**

- Changing any application code
- Speccing game-specific behaviour (relic scoring, cartridge preferences, etc.)
- Speccing the design system layer (deferred — covered adequately by CLAUDE.md)

## Decisions

**Write main specs directly (no delta headers)**
Since no `openspec/specs/` files exist yet, there is nothing to delta against. Specs are written as plain `### Requirement` / `#### Scenario` blocks without `## ADDED` wrappers. Future changes that modify these capabilities will use `## MODIFIED` delta specs against these files.

**One spec file per capability, not one per source file**
`save-behaviour` draws from both `usePendingSaves.ts` and `SavingToast.tsx`. Grouping by observable capability (not by source file) produces specs that remain stable under refactors.

**Known limitation captured in spec, not fixed**
The non-atomic preference save (delete-then-reinsert without a transaction) is a known limitation documented in `save-behaviour/spec.md` rather than fixed here.

## Risks / Trade-offs

- Specs may drift from code over time → Mitigation: future changes that touch these capabilities MUST update delta specs, which sync back on archive.
- Bootstrap specs are written from reading code + CLAUDE.md, not from user stories → some edge cases may be missing → treat these as v1; gaps surface when writing future delta specs.

## Open Questions

None — this is a documentation-only change with no implementation decisions pending.
