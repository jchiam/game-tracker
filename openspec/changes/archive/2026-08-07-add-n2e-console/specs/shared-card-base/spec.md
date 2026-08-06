## ADDED Requirements

### Requirement: Section-group primitive defined once

A **section group** — a labeled container that visually encloses a set of `.progress-section`s
under a single heading — SHALL be defined exactly once, in `src/styles/card.css`, as
`.card-section-group` (the container) and `.card-section-group-header` (its heading). It is the
canonical way for a game card to present several stat/investment sections as one named unit (first
consumer: the N2E Console group). Game stylesheets SHALL NOT re-declare these primitives, and SHALL
NOT introduce a game-local equivalent wrapper.

The primitive SHALL be visually **neutral**: a tokenized hairline border and neutral background,
with a heading styled consistently with `.section-header`. It SHALL carry no game-specific accent
colour, and games SHALL NOT layer a per-game accent tint onto it — every section group reads the
same across games. It references design tokens for colour, spacing, and radius per the "Card base
values reference design tokens" requirement (reserving only the documented overlay/glass literal
exceptions).

#### Scenario: A card groups sections under one header

- **WHEN** a game card wraps multiple `.progress-section`s in a named group (e.g. the N2E Console)
- **THEN** the container and heading resolve from the shared `.card-section-group` /
  `.card-section-group-header` rules in `card.css`, not a game-local re-declaration

#### Scenario: Section group is visually neutral

- **WHEN** the section-group primitive renders on any game card
- **THEN** its border, background, and heading use neutral tokenized values with no game accent
  colour, and no game stylesheet adds an accent-tint override

#### Scenario: Nested sections keep the shared primitives

- **WHEN** a `.card-section-group` encloses its child sections
- **THEN** each child is a shared `.progress-section` (via `ProgressSection`), and the group adds
  only the enclosing container + heading, never a re-declared section rule
