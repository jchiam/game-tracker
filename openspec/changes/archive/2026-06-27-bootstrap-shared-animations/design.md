## Context

`src/styles/animations.css` consolidates all shared `@keyframes` (its own header: "Consolidated
animation keyframes — single source of truth. Remove local duplicates from component files as they
are migrated."). It is imported globally via `src/index.css` (line 3, before `card.css` and
`controls.css`). A grep confirms no `@keyframes` is defined anywhere else under `src`. This change
documents that existing contract; it changes no code.

## Decisions

### One new capability, bootstrap pattern

Mirrors `bootstrap-design-system` and `2026-06-16-bootstrap-shared-infrastructure`: describe
existing code as `## ADDED Requirements`, validate `--strict`, archive into `openspec/specs/`.

### Duration tokens stay owned by shared-design-tokens

`shared-design-tokens` already requires animation `duration` values to use `--duration-*` tokens.
Restating that here would duplicate it. Today the codebase is **partially** migrated — some
consumers use `--duration-*` (`Modal.css`, `SavingToast.css`, `ToastContainer.css`,
`GameSwitcher.css`, `PartyEditorModal.css`), others still hardcode literals (`card.css` `0.5s`,
`RosterPageLayout.css` `0.6s`, `controls.css` `1.2s`, `ConfirmCheckbox.css` `1s`). So this spec
asserts only the keyframe-ownership invariant (which holds fully) and **cross-references** the
duration rule rather than claiming a universality that is not yet true.

### Route-independence is the load-bearing scenario

Because `animations.css` is imported by `index.css` (not a route-split bundle), a keyframe used by
one game's card resolves even on a cold load of a different route. This mirrors the
`shared-card-collapse` "mechanism lives in the global stylesheet" scenario and is the reason
keyframes must live here and not in a per-component file.

## Risks / Trade-offs

- **Migration debt is real but out of scope.** Hardcoded duration literals remain in several
  consumers; fixing them belongs to a future change against `shared-design-tokens`, not this
  documentation bootstrap.
- **Validator first-line rule.** Each `### Requirement` body opens with SHALL on its first line.
