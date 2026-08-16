## MODIFIED Requirements

### Requirement: Picker avatars resolve through ImageKit

The shared picker SHALL resolve every list avatar through the optional `resolveImage` prop, defaulting to `getAvatarUrl(entity.imageUrl)`, with the ui-avatars fallback applied on image error. Games whose stored assets need a different CDN transform MAY pass `resolveImage` (ZZZ passes its trim + face-crop transform resolver). No picker SHALL pass a raw local asset path to `<img src>`.

#### Scenario: HSR picker avatar fixed

- **WHEN** the HSR picker renders a character row with ImageKit configured
- **THEN** the `<img src>` is an ImageKit avatar URL derived from the character's `imageUrl`, not the raw `/assets/...` path

#### Scenario: Default resolver unchanged

- **WHEN** a per-game wrapper composes the picker without `resolveImage`
- **THEN** list avatars resolve via `getAvatarUrl`, identical to prior behaviour

#### Scenario: Custom resolver applied

- **WHEN** a wrapper passes `resolveImage` (ZZZ's trim + face-crop avatar transform)
- **THEN** each list avatar's `<img src>` is the resolver's return value for that entity's `imageUrl`
