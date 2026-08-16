## Purpose

The shared add-entity picker modal — one `AddEntityModal` component (`src/components/AddEntityModal.tsx`) implementing search, tracked-entity exclusion, avatar resolution, badge rendering, and the add flow for every game's roster picker, with per-game files reduced to thin config wrappers.

## Requirements

### Requirement: Shared add-entity picker modal

The system SHALL provide a single shared `AddEntityModal` component (`src/components/AddEntityModal.tsx`) implementing the add-entity picker used by every game: a `Modal` shell titled per game, a search input, and a scrollable list of untracked catalog entities each showing an avatar, name, badges, and a `+` add button. It SHALL be generic over the catalog entity type, constrained to `{ id: string; name: string; imageUrl: string }`, configured per game via props: `title`, `entityNoun` (drives the search placeholder and empty message), `available` (catalog entities), `tracked` (entities to exclude), `searchKeys` (Fuse.js keys), `getBadges` (badge descriptors), `onAdd`, and `onClose`.

#### Scenario: Untracked entities listed

- **WHEN** the picker opens with a catalog and a set of tracked entities
- **THEN** every catalog entity whose `id` matches a tracked entity's `id` is excluded, and the remainder is listed sorted by name

#### Scenario: Entity added

- **WHEN** a list row (or its `+` button) is clicked
- **THEN** `onAdd` is called with the full catalog entity

#### Scenario: Empty state

- **WHEN** the search term matches no untracked entity
- **THEN** a no-results message quoting the search term and the configured entity noun is shown

### Requirement: Fuzzy multi-key search in all pickers

The shared picker SHALL filter with Fuse.js (threshold 0.3) over the per-game `searchKeys`, in every game — including HSR and R1999, which previously used substring name matching. An empty or whitespace search term SHALL show the full untracked list sorted by name.

#### Scenario: Search by secondary key

- **WHEN** a search term matches a configured non-name key (e.g. an HSR path, an R1999 afflatus, an AE class)
- **THEN** entities matching on that key appear in the results

#### Scenario: Blank search shows all

- **WHEN** the search input is empty or whitespace
- **THEN** all untracked entities are listed alphabetically

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

### Requirement: Picker badges render via GameBadge descriptors

The shared picker SHALL render each entity's badges from the wrapper's `getBadges(entity)` descriptor list (`{ label, variant, modifier }[]`) through the shared `GameBadge` component, producing the canonical `game-badge {variant}-badge {variant}-{modifier}` class list. Wrappers SHALL NOT inject arbitrary badge markup.

#### Scenario: Descriptors become canonical badges

- **WHEN** a wrapper's `getBadges` returns `[{ label: 'Fire', variant: 'element', modifier: 'fire' }]`
- **THEN** the row renders one `GameBadge` span with classes `game-badge element-badge element-fire`

#### Scenario: Conditional badge

- **WHEN** a descriptor function omits a badge for an entity (e.g. an HSR character without a path)
- **THEN** only the returned descriptors render

### Requirement: Per-game wrappers preserve public modal interface

Each game's picker file (`AddCharacterModal` ×2, `AddArcanistModal`, `AddOperatorModal`) SHALL be a thin config wrapper over `AddEntityModal`, keeping its pre-existing component name and prop interface so no page changes. Per-game wrapper tests SHALL cover only wrapper config — title, badge descriptor output, secondary-key search wiring, tracked exclusion, and add passthrough — while generic picker behaviour is covered once by `AddEntityModal.test.tsx`.

#### Scenario: Pages unaffected

- **WHEN** the refactor lands
- **THEN** no page, hook, or service import changes

#### Scenario: Wrapper suites assert config wiring

- **WHEN** a per-game wrapper test suite runs
- **THEN** it asserts the game's title, badge variant/modifier classes, a secondary-key search hit, and the add callback receiving the full entity — without duplicating the shared suite's empty-state, image-fallback, or input-mechanics tests
