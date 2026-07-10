## ADDED Requirements

### Requirement: Semantic stat-option ordering

Stat-selection options (equip main/sub selectors and preference chains) SHALL be presented in a
single game-agnostic **semantic order**, identical in logic across every game. The order is a fixed
sequence of four buckets:

1. **Offensive** — ATK, ATK%, CRIT Rate, CRIT DMG/Multiplier, DMG bonus/multiplier (damage
   multiplier, elemental DMG, universal DMG), Break (Break Effect / Break Intensity), Pierce /
   Penetration.
2. **Defensive** — HP, HP%, DEF, DEF%, Effect RES.
3. **Tempo** — Speed / SPD, action gauge (e.g. Cycle Intensity), resource recovery (SP Recovery,
   Energy Regeneration).
4. **Supporting** — Healing (HP Recovery, Outgoing Healing, Healing Bonus), debuff application
   (Effect Hit Rate, Ailment Accuracy).

Within a bucket, a flat stat SHALL precede its percent variant (ATK before ATK%), otherwise the
master order above applies. Resource recovery (SP/Energy) is Tempo; HP Recovery (healing) is
Supporting.

This ordering SHALL be **explicit in the catalog data** — each game's `MAIN_STATS` (per slot) and
`SUB_STATS` arrays are authored/generated in semantic order, and the shared input primitives
(`Select`, `SubStatList`, `PreferenceChain`) render options in array order with **no runtime sort**.
Auto-generated pools SHALL be emitted in this order by their update script via an explicit ordered
label list; a stat absent from that list SHALL sort to the end (surfacing it for placement) rather
than being silently classified.

#### Scenario: A game's substat pool is in semantic order

- **WHEN** a game's `SUB_STATS` pool is read
- **THEN** its stats appear grouped Offensive → Defensive → Tempo → Supporting, flat before percent
  within a bucket

#### Scenario: Primitives do not re-sort options

- **WHEN** a stat pool is passed to `Select` / `SubStatList` / `PreferenceChain`
- **THEN** options render in the given array order; the component applies no reordering

#### Scenario: An unlisted stat surfaces rather than hiding

- **WHEN** an auto-generated pool contains a stat not in the generator's ordered label list
- **THEN** that stat is appended at the end of the pool (not dropped or silently bucketed), so the
  pinning test fails and a human places it
