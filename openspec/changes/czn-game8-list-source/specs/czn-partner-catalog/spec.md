# czn-partner-catalog delta

## MODIFIED Requirements

### Requirement: Partner id minted from the name

Because the source lists Partners without a stable slug and publishes no per-Partner pages, each Partner's `id` SHALL be the kebab-case slug of its `name` (e.g. `Akad` → `akad`, `Mei Lin` → `mei-lin`), unless `scripts/seeds/czn-id-pins.json` pins the source item's Game8 id to a committed id. The run SHALL abort on a duplicate minted id rather than emit two entries sharing one. Tracked rows and the overlay seed key on this id; once assigned it never changes, even when the source's spelling of the `name` does.

#### Scenario: Id derived from name

- **WHEN** the update script maps a source Partner named `Akad` with no pin
- **THEN** the emitted entry has `id: 'akad'`

#### Scenario: Two names slugify alike

- **WHEN** two source items would mint the same id
- **THEN** the script exits non-zero naming both Partners and the committed catalog is left unchanged

#### Scenario: Pinned id survives a respelling

- **WHEN** the source spells a Partner `Westmacott` and the pin file maps its Game8 id to `westmaccot`
- **THEN** the emitted entry keeps `id: 'westmaccot'` with `name: 'Westmacott'`, so tracked `partner_id` and `partner_preferences` values still resolve
