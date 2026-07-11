## ADDED Requirements

### Requirement: P5X weapon-rarity roster filter

The P5X roster toolbar SHALL render a "⚔ <5★" filter chip that, when active,
narrows the displayed roster to only thieves whose equipped weapon is below 5★
(`weaponRarity < 5`, i.e. rarity 2, 3, or 4). The chip composes with existing
search and sort, and with the rose-gate filter chip.

When both the "⚔ <5★" and "🌹 Gated" chips are active, they combine as a logical
AND: only thieves that satisfy **both** predicates are shown.

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
- **THEN** only thieves with `weaponRarity < 5` AND (`skillsLeveled && !roseMaxed`) are shown

#### Scenario: Filter composes with search and sort

- **WHEN** the "⚔ <5★" filter is active, sort is LEVEL, and user searches "fire"
- **THEN** only sub-5★-weapon thieves matching "fire" are shown, sorted by level descending (favorites first)

#### Scenario: Empty state when no thieves match

- **WHEN** the "⚔ <5★" filter is active but every tracked thief has `weaponRarity === 5`
- **THEN** an empty state message is shown
