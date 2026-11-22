# Spec Delta

## ADDED Requirements

### Requirement: Combatant face image

Each combatant SHALL have a square face image at `/assets/chaos-zero-nightmare/combatant-faces/{id}.webp`, derived from its `imageUrl` rather than stored in the catalog. `src/lib/imagekit.ts` SHALL provide `getCznCombatantFaceUrl`, which takes a combatant's `imageUrl` and returns the ImageKit URL of the face image with a width cap of 256 px that never upscales, falling back to the local face path when ImageKit is not configured. CZN party slots and the party member picker SHALL show this face image.

#### Scenario: Face path derived from the portrait path

- **WHEN** `getCznCombatantFaceUrl` is called with `/assets/chaos-zero-nightmare/combatants/haru.webp` and ImageKit is not configured
- **THEN** it returns `/assets/chaos-zero-nightmare/combatant-faces/haru.webp`

#### Scenario: Face served from ImageKit

- **WHEN** `getCznCombatantFaceUrl` is called with a combatant `imageUrl` and ImageKit is configured
- **THEN** it returns the ImageKit URL of the matching `chaos_zero_nightmare/combatant_faces` asset with a 256 px width cap that leaves smaller sources untouched

#### Scenario: Party slot shows the face

- **WHEN** a CZN party card or the party editor renders a filled slot
- **THEN** the slot image is the combatant's face image, not its full-body portrait

#### Scenario: Party picker shows the face

- **WHEN** the CZN party editor lists combatants to pick
- **THEN** each row's image is the combatant's face image

#### Scenario: Roster card keeps the portrait

- **WHEN** a CZN roster card renders
- **THEN** its header image is the combatant's portrait through the default mugshot crop
