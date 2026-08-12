# shared-ui-components — Delta

## MODIFIED Requirements

### Requirement: GameCardShell provides the shared roster-card structure

The shared `GameCardShell` component SHALL render the structural shell of every game's roster card
over the canonical `.game-card-*` skeleton (`shared-card-base`) and collapse mechanism
(`shared-card-collapse`): the header image resolved via `getMugshotUrl` with a loading spinner
while loading and a ui-avatars fallback on error, favorite and remove buttons titled
`Favorite {entityNoun}` / `Unfavorite {entityNoun}` / `Remove {entityNoun}`, an edit toggle titled
`Edit` / `Done editing`, and the summary ⇄ edit-body collapse driven by the `is-editing` class,
with both height budgets measured by the shell (`shared-card-collapse`). Game content SHALL enter
only through named slots: `badges` (rendered inside `.game-card-badges`), optional `headerExtra`
(rendered inside `.game-card-header-actions`, left of the edit toggle), `summaryStats`,
`summaryLine`, and `editBody`. The `summaryLine` slot SHALL accept `ReactNode | ReactNode[]`: a
single node renders inside one `.game-card-static-line` (unchanged behaviour), while an array
renders one `.game-card-static-line` per entry in order, each line independently subject to the
canonical nowrap/ellipsis truncation. Remaining props: `name` (card title and image alt),
`imageUrl` (catalog path), `entityNoun` (capitalised), `isFavorited`,
`onToggleFavorite((value: boolean) => void)` invoked with the inverted value, and `onRemove(e)`.
Game cards SHALL compose `GameCardShell` rather than re-implementing the header, controls, or
collapse mechanics.

#### Scenario: Slots render in their structural containers

- **WHEN** `GameCardShell` is rendered with slot content
- **THEN** `badges` appears inside `.game-card-badges`, `headerExtra` inside
  `.game-card-header-actions`, `summaryStats` inside `.game-card-static-stats`, `summaryLine`
  inside `.game-card-static-line`, and `editBody` inside `.game-card-edit-body-inner`

#### Scenario: Array summaryLine renders one static line per entry

- **WHEN** `GameCardShell` is rendered with `summaryLine={[lineA, lineB]}`
- **THEN** the summary contains two sibling `.game-card-static-line` divs, the first containing
  `lineA` and the second `lineB`, each independently truncating with ellipsis on overflow

#### Scenario: Multi-line summary is absorbed by the measured height budget

- **WHEN** an array `summaryLine` adds a second static line to the collapsed summary
- **THEN** the shell's measured `--game-card-summary-max-height` (taken from
  `.game-card-static-summary-inner` scrollHeight per `shared-card-collapse`) includes the extra
  line with no change to the collapse mechanism

#### Scenario: Buttons titled with the entity noun

- **WHEN** the shell is rendered with `entityNoun="Arcanist"`
- **THEN** the controls are titled `Favorite Arcanist` (or `Unfavorite Arcanist` when favorited)
  and `Remove Arcanist`, and clicking the favorite button invokes `onToggleFavorite` with the
  inverted `isFavorited` value

#### Scenario: Edit toggle round trip

- **WHEN** the edit toggle is clicked
- **THEN** `.game-card-body` gains `is-editing` and `.game-card-edit-body` drops
  `aria-hidden`; a second click (now titled `Done editing`) reverts both

#### Scenario: Image loading and fallback

- **WHEN** the header image is still loading
- **THEN** a spinner shows in the image wrapper; on load it disappears, and on error the image
  source falls back to a ui-avatars URL derived from `name`
