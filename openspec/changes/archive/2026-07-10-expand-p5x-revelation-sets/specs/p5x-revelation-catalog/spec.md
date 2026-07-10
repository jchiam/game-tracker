## MODIFIED Requirements

### Requirement: Heavens set catalog

The system SHALL maintain a static catalog of all Heavens Revelation Card sets. Each set entry SHALL include: `id` (kebab-case string), `name` (display string), `twoSetEffect` (string description), and `fourSetEffect` (string description). The catalog SHALL be exported as `ALL_HEAVENS_SETS`, ordered alphabetically by `name`. The catalog SHALL be the full canonical Heavens set list per the pinned source (Game8 — List of All Revelation Cards), not a subset. Existing set `id`s SHALL remain stable when the catalog is expanded (additive only — no renames or removals).

#### Scenario: Catalog contains the full canonical Heavens set list

- **WHEN** the catalog is loaded
- **THEN** it contains at least 26 Heavens sets, including `control`, `courage`, `hindrance`, `labor`, `love`, `opulence`, `peace`, `pleasure`, `power`, `prosperity`, `renewal`, `strife`, `truth`, and `victory`

#### Scenario: Previously-missing sets are present

- **WHEN** the catalog is searched for the id `labor`
- **THEN** an entry is found with a non-empty `name`, `twoSetEffect`, and `fourSetEffect`

#### Scenario: Each set has both effects described

- **WHEN** a set entry is read
- **THEN** both `twoSetEffect` and `fourSetEffect` are non-empty strings

### Requirement: Space set catalog

The system SHALL maintain a static catalog of all Space Revelation Card sets. Each set entry SHALL include: `id` (kebab-case string), `name` (display string), and `effect` (string description). The catalog SHALL be exported as `ALL_SPACE_SETS`, ordered alphabetically by `name`. The catalog SHALL be the full canonical Space set list per the pinned source (Game8 — List of All Revelation Cards), not a subset. Existing set `id`s SHALL remain stable when the catalog is expanded (additive only — no renames or removals).

#### Scenario: Catalog contains the full canonical Space set list

- **WHEN** the catalog is loaded
- **THEN** it contains at least 16 Space sets, including `acceptance`, `awareness`, `departure`, `faith`, `growth`, `harmony`, `integrity`, `meditation`, and `trust`

#### Scenario: Previously-missing sets are present

- **WHEN** the catalog is searched for the id `integrity`
- **THEN** an entry is found with a non-empty `name` and `effect`

#### Scenario: Each set has an effect described

- **WHEN** a Space set entry is read
- **THEN** its `effect` is a non-empty string
