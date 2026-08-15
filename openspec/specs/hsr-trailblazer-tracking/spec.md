# Spec: hsr-trailblazer-tracking

## Purpose

Makes the Honkai: Star Rail Trailblazer trackable: one catalog entry per path form generated from the StarRailRes `{NICKNAME}` placeholder, dual gender portraits, and a cosmetic display-gender toggle that drives portrait resolution on roster cards and party avatars.

## Requirements

### Requirement: Trailblazer catalog entries per path form

The HSR update script SHALL emit one character catalog entry per Trailblazer path form instead of dropping `{NICKNAME}`-named source entries. Each entry SHALL have display name `Trailblazer (<Path>)`, stable ID `trailblazer_<path-slug>`, and the form's element and path. Source entries that differ only by gender SHALL be deduplicated to a single catalog entry per path form.

#### Scenario: Trailblazer forms present in catalog

- **WHEN** the update script runs against source data containing Trailblazer entries for Destruction, Preservation, Harmony, Remembrance, and Elation
- **THEN** the generated catalog contains exactly one entry per form, named `Trailblazer (Destruction)`, `Trailblazer (Preservation)`, `Trailblazer (Harmony)`, `Trailblazer (Remembrance)`, `Trailblazer (Elation)`, with IDs `trailblazer_destruction`, `trailblazer_preservation`, `trailblazer_harmony`, `trailblazer_remembrance`, `trailblazer_elation`

#### Scenario: Gender duplicates collapse to one entry

- **WHEN** the source data contains two Trailblazer entries for the same path form (one per gender)
- **THEN** the generated catalog contains a single entry for that form

#### Scenario: New future form appears automatically

- **WHEN** a later game version adds a Trailblazer form for a new path and the source data gains its entries
- **THEN** the next update-script run emits a catalog entry for the new form with the same naming and ID pattern, with no further code change

#### Scenario: Other placeholder entries still dropped

- **WHEN** the source data contains non-Trailblazer placeholder or non-playable entries
- **THEN** those entries remain excluded from the generated catalog

### Requirement: Dual gender portraits

The update script SHALL download and publish both gender portraits for each Trailblazer form. The catalog entry's default portrait (`imageUrl`) SHALL be the female (Stelle) portrait and the entry SHALL carry an alternate portrait (`altImageUrl`) for the male (Caelus) variant. Non-Trailblazer entries SHALL carry no alternate portrait.

#### Scenario: Both portraits published

- **WHEN** the update script processes a Trailblazer form
- **THEN** both the Stelle and Caelus portraits are downloaded and uploaded to the CDN (idempotently, skipping already-uploaded assets), and the catalog entry references the Stelle portrait as default and the Caelus portrait as alternate

#### Scenario: Regular characters unchanged

- **WHEN** the update script processes a non-Trailblazer character
- **THEN** the catalog entry has no alternate portrait

### Requirement: Cosmetic display-gender toggle

The system SHALL track a per-user display-gender choice on each tracked character whose catalog entry carries an alternate portrait. The choice SHALL default to the default portrait (Stelle), persist across sessions, and have no effect on any non-cosmetic tracked data (level, traces, relics, light cone, build preferences, scoring).

#### Scenario: Toggle only on alternate-portrait entries

- **WHEN** a roster card renders for a character whose catalog entry has no alternate portrait
- **THEN** no display-gender control is shown

#### Scenario: Toggle appears on Trailblazer cards

- **WHEN** a roster card renders for a tracked Trailblazer form
- **THEN** a display-gender control is shown

#### Scenario: Choice persists

- **WHEN** the user switches a Trailblazer form's display gender and reloads the app
- **THEN** the chosen gender is restored from the DB

#### Scenario: Cosmetic only

- **WHEN** the user switches display gender
- **THEN** level, traces, relics, light cone, build preferences, and equipment score are unchanged

### Requirement: Gender-aware portrait resolution

Roster card header images and party slot avatars SHALL render the alternate portrait when the tracked character's display gender is set to the alternate, and the default portrait otherwise.

#### Scenario: Card reflects toggle

- **WHEN** a tracked Trailblazer form has display gender set to Caelus
- **THEN** the roster card header shows the Caelus portrait

#### Scenario: Party avatar reflects toggle

- **WHEN** a party contains a Trailblazer form whose display gender is set to Caelus
- **THEN** the party slot avatar (builder and card) shows the Caelus portrait

#### Scenario: Default without choice

- **WHEN** a tracked Trailblazer form has no stored display-gender choice
- **THEN** the Stelle portrait is shown

### Requirement: Independent per-form tracking

Each Trailblazer form SHALL be trackable as an independent roster entry with its own level, traces, relics, light cone, build preferences, and score, following the same behavior as any other catalog character.

#### Scenario: Two forms tracked side by side

- **WHEN** the user adds `Trailblazer (Harmony)` and `Trailblazer (Remembrance)` to the roster
- **THEN** each renders its own card and persists its own tracked fields without affecting the other
