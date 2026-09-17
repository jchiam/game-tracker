## ADDED Requirements

### Requirement: Outer-Mindscape roster filter

The P5X roster toolbar SHALL render a "MS ✗" filter chip that, when active,
narrows the displayed roster to only thieves whose Outer Mindscape half is not
yet completed (`mindscapeProgress === 0`). The chip follows the shared
`roster-predicate-filter` pattern: it is off by default, page-local, and
composes with search, sort, and every other active P5X chip as an intersection.
When it is the only active chip and no thief matches, the roster SHALL show
`No thieves without Outer Mindscape.`

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders with tracked thieves
- **THEN** a "MS ✗" filter chip is visible in the filter row after the "⚔ <5★" chip

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "MS ✗" filter chip
- **THEN** only thieves with `mindscapeProgress === 0` are shown; thieves at `1` (Outer done) or `2` (Inner done) are excluded

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "MS ✗" filter chip
- **THEN** all tracked thieves (matching current search/sort and any other active chip) are shown again

#### Scenario: Composes with the rose gate

- **WHEN** both the "MS ✗" and "🌹 Gated" chips are active
- **THEN** only thieves with `mindscapeProgress === 0` AND `skillProgress === 1` are shown

#### Scenario: Card held after Outer is set mid-edit

- **WHEN** the "MS ✗" chip is active and the user sets a rendered thief's Mindscape to Outer
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches MS ✗` until the edit commits, then plays its exit animation

#### Scenario: Empty state when every thief has Outer done

- **WHEN** the "MS ✗" chip is the only active chip and every tracked thief has `mindscapeProgress >= 1`
- **THEN** the roster shows `No thieves without Outer Mindscape.`

### Requirement: Incomplete-revelations roster filter

The P5X roster toolbar SHALL render a "◈ Rev <5" filter chip that, when active,
narrows the displayed roster to only thieves with at least one empty revelation
slot — fewer than five of the Sun/Moon/Star/Sky/Space slots hold an equipped
card. A slot counts as equipped only when its card has a set, the same test the
card's `Rev n/5` summary chip uses, so the chip and the card never disagree. A
thief with no cards at all matches. The chip follows the shared
`roster-predicate-filter` pattern: off by default, page-local, composing with
search, sort, and every other active P5X chip as an intersection. When it is the
only active chip and no thief matches, the roster SHALL show
`No thieves with open revelation slots.`

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders with tracked thieves
- **THEN** a "◈ Rev <5" filter chip is visible in the filter row after the "MS ✗" chip

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "◈ Rev <5" filter chip
- **THEN** only thieves whose equipped-card count is 0–4 are shown; thieves with all five slots equipped are excluded

#### Scenario: Card without a set does not count as equipped

- **WHEN** the "◈ Rev <5" chip is active and a thief has five slot entries but one has no set selected
- **THEN** that thief is shown (four equipped cards)

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "◈ Rev <5" filter chip
- **THEN** all tracked thieves (matching current search/sort and any other active chip) are shown again

#### Scenario: Composes with the weapon chip

- **WHEN** both the "◈ Rev <5" and "⚔ <5★" chips are active
- **THEN** only thieves with fewer than five equipped cards AND `weaponRarity < 5` are shown

#### Scenario: Card held until the revelation editor closes

- **WHEN** the "◈ Rev <5" chip is active and the user equips a thief's fifth card in the revelation editor
- **THEN** the card stays in the grid dimmed with the ghost tag `no longer matches ◈ Rev <5` until the editor closes, then plays its exit animation

#### Scenario: Empty state when every thief is fully equipped

- **WHEN** the "◈ Rev <5" chip is the only active chip and every tracked thief has five equipped cards
- **THEN** the roster shows `No thieves with open revelation slots.`

## MODIFIED Requirements

### Requirement: P5X weapon-rarity roster filter

The P5X roster toolbar SHALL render a "⚔ <5★" filter chip that, when active,
narrows the displayed roster to only thieves whose equipped weapon is below 5★
(`weaponRarity < 5`, i.e. rarity 2, 3, or 4). The chip composes with existing
search and sort, and with every other P5X filter chip.

When two or more P5X chips are active, they combine as a logical AND: only
thieves that satisfy **every** active predicate are shown, and the roster's
no-match copy is the generic `No thieves match the active filters.` The four
P5X chips render in the order 🌹 Gated · ⚔ <5★ · MS ✗ · ◈ Rev <5, matching the
card summary's Weapon → Mindscape → Revelations chip order.

#### Scenario: Filter chip shown in toolbar

- **WHEN** the P5X roster view renders
- **THEN** a "⚔ <5★" filter chip is visible in the toolbar area, alongside the "🌹 Gated" chip

#### Scenario: Activating the filter narrows roster

- **WHEN** user activates the "⚔ <5★" filter chip
- **THEN** only thieves with `weaponRarity < 5` are shown

#### Scenario: Deactivating the filter restores full roster

- **WHEN** user deactivates the "⚔ <5★" filter chip
- **THEN** all tracked thieves (matching current search/sort and any other active filter) are shown again

#### Scenario: Both filters active compose as AND

- **WHEN** both the "⚔ <5★" and "🌹 Gated" chips are active
- **THEN** only thieves with `weaponRarity < 5` AND `skillProgress === 1` are shown

#### Scenario: All four chips active compose as AND

- **WHEN** every P5X chip is active
- **THEN** only thieves that satisfy all four predicates are shown, and the no-match copy (when none does) is `No thieves match the active filters.`

#### Scenario: Filter composes with search and sort

- **WHEN** the "⚔ <5★" filter is active, sort is LEVEL, and user searches "fire"
- **THEN** only sub-5★-weapon thieves matching "fire" are shown, sorted by level descending (favorites first)

#### Scenario: Empty state when no thieves match

- **WHEN** the "⚔ <5★" filter is the only active chip but every tracked thief has `weaponRarity === 5`
- **THEN** the roster shows `No thieves with a sub-5★ weapon.`
