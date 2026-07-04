## REMOVED Requirements

### Requirement: Directly-rendered badges include the base class

**Reason**: Its only subjects were the hand-built badge spans in the picker modals. Those now render via `GameBadge` descriptors (see `shared-entity-picker`), and no hand-rendered `game-badge` spans remain in the codebase, so the requirement has no remaining subject.

**Migration**: Badge output in picker modals is governed by the `shared-entity-picker` capability's "Picker badges render via GameBadge descriptors" requirement.
