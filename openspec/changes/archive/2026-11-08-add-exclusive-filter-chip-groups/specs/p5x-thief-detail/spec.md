## ADDED Requirements

### Requirement: P5X roster filter facets

The P5X roster toolbar SHALL declare four filter facets holding eight chips
through the shared `roster-predicate-filter` pattern (off by default,
page-local, composing with search and sort), rendered as a matrix in this
order — the card summary's Weapon → Mindscape → Revelations → Skills sequence:

| facet       | mode  | chip            | keeps thieves where                                                                                                                                                                                     | single-chip no-match copy                       |
| ----------- | ----- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Weapon      | `any` | `Sub-5★`        | `weaponRarity < 5`                                                                                                                                                                                      | `No thieves with a sub-5★ weapon.`              |
| Weapon      | `any` | `Under Lv 80`   | `weaponLevel < 80`                                                                                                                                                                                      | `No thieves with a weapon below Lv 80.`         |
| Mindscape   | `one` | `No Outer`      | `mindscapeProgress === 0`                                                                                                                                                                               | `No thieves without Outer Mindscape.`           |
| Mindscape   | `one` | `No Inner`      | `mindscapeProgress === 1`                                                                                                                                                                               | `No thieves with Outer done and Inner pending.` |
| Revelations | `any` | `Open slots`    | fewer than five equipped revelation cards (a card without a set does not count, the same test as the card's `Rev n/5` chip)                                                                             | `No thieves with open revelation slots.`        |
| Revelations | `any` | `No build`      | no revelation Target Build is set — no Heavens set, no Space set, no sub-stat chain, and no Moon/Star/Sky main-stat chain (the same test the revelation scorer uses for its insufficient-data sentinel) | `No thieves without a revelation Target Build.` |
| Skills      | `one` | `Under Lv 8`    | `skillProgress === 0`                                                                                                                                                                                   | `No thieves with skills below Lv8.`             |
| Skills      | `one` | `🌹 Rose-gated` | `skillProgress === 1`                                                                                                                                                                                   | `No rose-gated thieves found.`                  |

Every chip label is a noun phrase naming the missing progression; no chip
label carries a dimension prefix, a `<` threshold, or a `✗` glyph. The
Mindscape and Skills facets are `one` mode: within each at most one chip is
active and the pair renders as one joined segment. Weapon and Revelations are
`any` mode. Chips across facets compose as a logical AND; when two or more
chips are active and nothing matches, the no-match copy is the generic
`No thieves match the active filters.` The `No build` predicate and the
revelation scorer SHALL share one preference-presence definition so the chip
and the score badge never disagree.

#### Scenario: Four facet rows render in card order

- **WHEN** the P5X roster view renders with tracked thieves
- **THEN** the filter row shows four labelled group rows, top to bottom "Weapon", "Mindscape", "Revelations", "Skills", holding in order `Sub-5★`, `Under Lv 80`; `No Outer`, `No Inner`; `Open slots`, `No build`; `Under Lv 8`, `🌹 Rose-gated`

#### Scenario: Mindscape and Skills render as joined segments

- **WHEN** the filter row renders
- **THEN** the Mindscape and Skills chip pairs each render as one joined segmented pill, while the Weapon and Revelations pairs render as spaced pills

#### Scenario: Weapon-rarity chip narrows roster

- **WHEN** user activates `Sub-5★`
- **THEN** only thieves with `weaponRarity < 5` are shown

#### Scenario: Weapon-level chip narrows roster

- **WHEN** user activates `Under Lv 80`
- **THEN** only thieves with `weaponLevel < 80` are shown; a thief with a 5★ weapon at Lv 79 is shown, one at Lv 80 is not

#### Scenario: Weapon chips toggle independently

- **WHEN** user activates `Sub-5★` and then `Under Lv 80`
- **THEN** both are active and only thieves with `weaponRarity < 5` AND `weaponLevel < 80` are shown

#### Scenario: Outer-Mindscape chip narrows roster

- **WHEN** user activates `No Outer`
- **THEN** only thieves with `mindscapeProgress === 0` are shown; thieves at `1` or `2` are excluded

#### Scenario: Inner-Mindscape chip narrows roster

- **WHEN** user activates `No Inner`
- **THEN** only thieves with `mindscapeProgress === 1` are shown; thieves at `0` or `2` are excluded

#### Scenario: Mindscape chips are mutually exclusive

- **WHEN** `No Outer` is active and the user clicks `No Inner`
- **THEN** `No Inner` becomes active, `No Outer` becomes inactive, and the roster shows thieves at `mindscapeProgress === 1`

#### Scenario: Clicking the active Mindscape chip clears the facet

- **WHEN** `No Inner` is active and the user clicks it
- **THEN** neither Mindscape chip is active and the roster widens accordingly

#### Scenario: Open-slots chip narrows roster

- **WHEN** user activates `Open slots`
- **THEN** only thieves whose equipped-card count is 0–4 are shown; a thief with five slot entries one of which has no set counts as four and is shown

#### Scenario: No-build chip narrows roster

- **WHEN** user activates `No build`
- **THEN** only thieves whose revelation preferences have no Heavens set, no Space set, no sub-stat chain, and empty Moon/Star/Sky main-stat chains are shown, regardless of how many cards they have equipped

#### Scenario: No-build chip agrees with the score badge

- **WHEN** a thief has cards equipped and the `No build` chip keeps it
- **THEN** that thief's revelation score is the insufficient-data sentinel and no score badge is shown

#### Scenario: Skills-below-Lv8 chip narrows roster

- **WHEN** user activates `Under Lv 8`
- **THEN** only thieves with `skillProgress === 0` are shown

#### Scenario: Rose-gated chip narrows roster

- **WHEN** user activates `🌹 Rose-gated`
- **THEN** only thieves with `skillProgress === 1` are shown

#### Scenario: Skills chips are mutually exclusive

- **WHEN** `🌹 Rose-gated` is active and the user clicks `Under Lv 8`
- **THEN** `Under Lv 8` becomes active, `🌹 Rose-gated` becomes inactive, and the roster shows thieves at `skillProgress === 0`

#### Scenario: Chips across facets compose as AND

- **WHEN** `No Outer`, `Sub-5★`, and `🌹 Rose-gated` are active
- **THEN** only thieves with `mindscapeProgress === 0` AND `weaponRarity < 5` AND `skillProgress === 1` are shown, and the no-match copy (when none does) is `No thieves match the active filters.`

#### Scenario: Chips compose with search and sort

- **WHEN** `Sub-5★` is active, sort is LEVEL, and user searches "fire"
- **THEN** only sub-5★-weapon thieves matching "fire" are shown, sorted by level descending (favorites first)

#### Scenario: Deactivating a chip restores the roster

- **WHEN** user deactivates the only active chip
- **THEN** all tracked thieves (matching current search/sort) are shown again

#### Scenario: Single-chip empty states use the chip's copy

- **WHEN** exactly one chip is active and no thief matches it
- **THEN** the roster shows that chip's no-match copy from the table above

#### Scenario: Card held after Outer is set mid-edit

- **WHEN** `No Outer` is active and the user sets a rendered thief's Mindscape to Outer
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches Mindscape · No Outer` until the edit commits, then plays its exit animation

#### Scenario: Card held after Inner is set mid-edit

- **WHEN** `No Inner` is active and the user sets a rendered thief's Mindscape to Inner
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches Mindscape · No Inner` until the edit commits, then plays its exit animation

#### Scenario: Card held until the revelation editor closes

- **WHEN** `Open slots` is active and the user equips a thief's fifth card in the revelation editor
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches Revelations · Open slots` until the editor closes, then plays its exit animation

#### Scenario: Card held after a Target Build is saved

- **WHEN** `No build` is active and the user saves a Heavens set preference for a rendered thief in the revelation editor
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches Revelations · No build` until the editor closes, then plays its exit animation

## REMOVED Requirements

### Requirement: Rose-gated roster filter

**Reason**: Folded into the consolidated "P5X roster filter facets" requirement, where the chip is relabelled `🌹 Rose-gated` and becomes the second member of the `one`-mode Skills facet, rendered last.
**Migration**: Predicate (`skillProgress === 1`) and no-match copy are unchanged; tests that assert the `🌹 Gated` label or the chip's position must use the new label and the facet matrix.

### Requirement: P5X weapon-rarity roster filter

**Reason**: Folded into the consolidated "P5X roster filter facets" requirement as `Sub-5★` in the Weapon facet; the four-chip ordering it stated (`🌹 Gated · ⚔ <5★ · MS ✗ · ◈ Rev <5`) is superseded.
**Migration**: Predicate (`weaponRarity < 5`) and no-match copy are unchanged; the label `⚔ <5★` becomes `Sub-5★`.

### Requirement: Outer-Mindscape roster filter

**Reason**: The `MS ✗` chip is relabelled `No Outer` and paired with `No Inner` in the `one`-mode Mindscape facet under the consolidated requirement.
**Migration**: Predicate (`mindscapeProgress === 0`) and no-match copy are unchanged; the chip key becomes `mindscapeOuter` and the ghost tag reads `no longer matches Mindscape · No Outer`. Chip keys are page-local and never persisted, so no data migration.

### Requirement: Incomplete-revelations roster filter

**Reason**: Folded into the consolidated "P5X roster filter facets" requirement as `Open slots` in the Revelations facet alongside the new `No build` chip.
**Migration**: Predicate (`countEquippedRevelations < 5`) and no-match copy are unchanged; the label `◈ Rev <5` becomes `Open slots` and the ghost tag reads `no longer matches Revelations · Open slots`.
