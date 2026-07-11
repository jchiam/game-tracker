## Context

Architecture-review finding 4 (2026-07-11, Strong). The Game Card Shell concentrated card structure, but the Target Build chain-row block escaped it: six hand-rendered copies across three cards, all using the shared `card.css` classes and the same operator-glyph literal. `PreferenceChain` (the editor) is already a shared L3 component; its read-only counterpart is not.

## Goals / Non-Goals

**Goals:**

- One implementation of the read-only chain row: label + stat badges + operator badges + glyph mapping + empty-chain guard.
- Cards pass `label`, `chain`, and (P5X only) a `formatStat` label resolver — no chain markup in card files.

**Non-Goals:**

- Set rows and comments rows stay per-game: not chains, and game-specific (HSR two set names, N2E set name + rarity badge, P5X space + heavens names). Lifting them would trade six identical blocks for a config surface as wide as the markup.
- No CSS change — all classes already shared in `card.css`.
- No change to the outer Target Build `ProgressSection` / `.prefs-display-grid` wrapper or its visibility condition (already specced per game).

## Decisions

**Presentational component, chain-row scope.** `PreferenceChainReadout({ label, chain, formatStat? })` renders exactly one `.pref-display-row`. The grid wrapper stays in the card — cards still decide which rows exist and in what order (that ordering is game domain: slots differ per game). _Alternative — a whole-readout component taking a row config array:_ rejected; set/comments rows are game-specific, so the config would re-encode per-game markup as data (MOVE, not CONCENTRATE).

**`formatStat` optional, identity default.** P5X chains persist stat ids and display in-game labels (`statLabel`); HSR/N2E chains store display strings. An optional `(stat: string) => string` keeps the vocabulary per-game (same seam shape as the scoring shape maps) without forcing HSR/N2E to pass a no-op.

**Empty chain renders `null`.** Concentrates the `chain.length === 0` guard the cards currently repeat around each row. Cards keep their outer "any preference exists" section guard.

**No own CSS file.** Uses `card.css` classes, like `ProgressSection`. The CLAUDE.md L3 table row says "uses `card.css`".

## Risks / Trade-offs

- **Markup must stay byte-identical** so existing card tests (which assert badge text/glyphs) pass unchanged — that is the verification, same as the stat-matcher change.
- **Key-by-index preserved** — chain rows are read-only and rebuilt per render; index keys are safe here and match current behaviour.
