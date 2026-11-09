# Spec Delta

## ADDED Requirements

### Requirement: Preference match badge defined once

The equipped-vs-preferred match pill SHALL be defined exactly once, in `src/styles/card.css`, as `.pref-match-badge`: a small bordered pill (margin, padding, `xs` font, bold, 1px border, small radius) whose colour and border colour are set inline by the game card from the shared progress gradient. Every game card that reports an equipped item's rank against a preference list SHALL use this class. Game stylesheets SHALL NOT re-declare the pill.

#### Scenario: AE and CZN share the pill

- **WHEN** the AE operator card and the CZN combatant card each render a match badge
- **THEN** both resolve shape, spacing, and typography from the single `.pref-match-badge` rule in `card.css`, with only the inline colour differing per card state

#### Scenario: No game-local match pill remains

- **WHEN** the game card stylesheets are searched for a match-badge pill rule
- **THEN** none declares one; `card.css` is the only definition
