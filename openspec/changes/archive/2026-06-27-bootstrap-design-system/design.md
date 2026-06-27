## Context

The design system is organised in four layers (CLAUDE.md → "Design System"):

```
L1  Design Tokens     src/styles/design-tokens.json → tokens.css
L2  Shared Styles     src/styles/card.css, controls.css, animations.css
L3  Shared Components src/components/ (Modal, GameSwitcher, …)
L4  Game Components   src/pages/{game}/components/ (game-unique only)
```

Specs exist for parts of L2 (`shared-card-controls`, `shared-card-collapse`,
`shared-card-badges`) and one util (`shared-progress-gradient`). L1, the L2 card skeleton, and L3
are unspecced. This change is documentation only — it describes existing code, changes none of it.

## Decisions

### One change, three new capabilities

Mirrors `2026-06-16-bootstrap-shared-infrastructure`, which specced three capabilities
(`shared-auth`, `save-behaviour`, `image-pipeline`) in a single bootstrap change. One validate +
archive cycle keeps the related L1/L2/L3 documentation landing together.

### No overlap with the four existing card/util specs

The new specs must not restate requirements already owned elsewhere. The rule:

- `shared-card-base` documents the **skeleton and chrome** (`.game-card`, header, overlay,
  controls, body, name, the three buttons, progress-section primitives). It does **not** restate
  the collapse mechanism (`shared-card-collapse`), the control primitives `.toggle-btn` /
  `.level-slider` / `.game-select` (`shared-card-controls`), or the `.game-badge` pill
  (`shared-card-badges`). Those are cross-referenced, not redeclared.
- `shared-ui-components` documents `GameBadge` only by reference — its contract is owned by
  `shared-card-badges`.

A grep of the new specs for `collapse` / `is-editing` / `toggle-btn` / `level-slider` /
`game-select` should find only cross-reference prose, never a `### Requirement` redeclaring them.

### Skip components already specced behaviourally

A design-system spec captures the **visual/structural contract** (classes, props, "games override
only X"), not behaviour another spec already asserts. These are therefore out of scope:

| Component                            | Already owned by        |
| ------------------------------------ | ----------------------- |
| `AuthGate`                           | `shared-auth`           |
| `SavingToast`, `ToastContainer`      | `shared-save-behaviour` |
| `RosterPageLayout`, `LoadErrorState` | `shared-roster`         |
| `GameBadge`                          | `shared-card-badges`    |

`shared-ui-components` covers the remainder: `StatChip`, `ProgressSection`, `Modal`,
`GameSwitcher`, `Navbar`, `ConfirmCheckbox`, `PreferenceChain`.

### L1 tokens spec is discipline, not enumeration

`shared-design-tokens` documents the _rules_ for using tokens (token-first CSS, generated
`tokens.css`, game-colour namespacing, canonical names, duration vs transition) — not a frozen
list of every token value, which would churn on every palette tweak and duplicate the JSON.

### Scope boundary

L4 game components are out — they churn and CLAUDE.md says not to Storybook them. The token-vs-
type discipline ("never `supabase gen types`", hand-authored `src/types.ts`) is a code convention
about `types.ts`, not the token pipeline, so it is intentionally **not** pulled into the token spec.

## Risks / Trade-offs

- **Drift between spec and code.** Mitigated by sourcing every requirement from the actual file
  (`card.css`, `design-tokens.json`, each component) at authoring time, and by the no-overlap grep
  check before archive.
- **Validator first-line rule.** Each `### Requirement` body must open with SHALL/MUST on its
  first line (the validator reads only the first line) — this bit the badge spec once.
