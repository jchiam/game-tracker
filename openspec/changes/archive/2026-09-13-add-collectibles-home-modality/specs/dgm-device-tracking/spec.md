## ADDED Requirements

### Requirement: Tracked device persistence

The system SHALL persist a user's tracked devices in `dgm_tracked_devices` with columns `id` (uuid), `profile_id` (FK `user_profiles`, cascade), `device_id`, `status` (`'owned' | 'wishlist'`, default `'owned'`), `condition` (`'sealed' | 'boxed' | 'loose'` or NULL), `acquired_on` (DATE, nullable), `notes` (TEXT, default `''`), `is_favorited` (default false), `created_at`; unique on `(profile_id, device_id)`; RLS user-scoped on `profile_id`; index on `profile_id`. `src/services/digimon/deviceService.ts` SHALL be a `createRosterPersistence` config adapter with no extras, re-exporting `loadDevicesFromDB`, `insertDevice`, `deleteDevice`, `updateDevice`.

#### Scenario: Load merges catalog and rows

- **WHEN** `loadDevicesFromDB` runs for a session with rows
- **THEN** each row whose `device_id` matches `ALL_DEVICES` yields a `DgmTrackedDevice` with `dbId`, `status`, `condition`, `acquiredOn` (ISO date string or null), `notes`, `isFavorited`; rows with no catalog match are dropped

#### Scenario: Insert defaults

- **WHEN** `insertDevice` runs
- **THEN** the row is inserted with `status = 'owned'`, `condition = NULL`, `acquired_on = NULL`, `notes = ''`, `is_favorited = false`

#### Scenario: Patch column map

- **WHEN** `updateDevice` receives a patch with `status`, `condition`, `acquiredOn`, `notes`, or `isFavorited`
- **THEN** it writes `status`, `condition`, `acquired_on`, `notes`, `is_favorited` respectively

### Requirement: Device roster hook

`src/hooks/digimon/useDevices.ts` SHALL wrap the shared `useRoster` with the device catalog and persistence functions, nouns `device` / `devices`, Fuse keys `name`, `line`, `series`, `colorway`, and SHALL expose `updateStatus`, `updateCondition`, `updateAcquiredOn`, `updateNotes`, `toggleFavorite` — every one declared via `makeFieldUpdater` with no custom body — plus `getFilteredRoster(searchTerm, sortBy: 'ALPHA' | 'YEAR', entities?)` where `YEAR` orders by `releaseYear` ascending then name.

#### Scenario: Add device optimistic

- **WHEN** `addDevice` is called with a catalog device
- **THEN** it appears in `trackedDevices` immediately with `status 'owned'`, `condition null`, `acquiredOn null`, `notes ''`, `isFavorited false`, and the insert is issued through the service

#### Scenario: Year sort

- **WHEN** `getFilteredRoster('', 'YEAR')` runs over devices from 1997 and 2001
- **THEN** favorited devices come first, then the 1997 device before the 2001 device, ties broken by name

### Requirement: Device page

`src/pages/digimon/DigimonPage.tsx` SHALL compose `useDevices`, `useRosterView` (sort modes `ALPHA` "AZ" / `YEAR` "Yr"; placeholder "Search by name, line, series, or colour…"; add title "Add Device"), and `RosterPageLayout` with title "Digimon Virtual Pets", `secondViewLabel` "Completion", empty message "No devices in your collection yet. Use the + button to begin!", and the completion view in `secondView`. Favorite toggles and edit commits SHALL call `projection.refreshBasis(id)`.

#### Scenario: Roster renders device cards

- **WHEN** the page renders with a session and tracked devices
- **THEN** one `DeviceCard` renders per filtered device and the tab bar offers "Roster" and "Completion"

#### Scenario: Registry wiring

- **WHEN** `GAMES` is read
- **THEN** it contains the entry `id 'dgm'`, `path '/digimon'`, `modality 'collection'`, `bgClass 'bg-dgm-sel'` with a lazy `DigimonPage`

### Requirement: Device card

`DeviceCard` SHALL compose `GameCardShell` with `entityNoun` "Device", `resolveImage` `getDeviceImageUrl`, badges `GameBadge` for `line` (variant `dgm-line`) and `region` (variant `dgm-region`), summary `StatChip`s for status, condition (when set), and release year, summary line `{series} · {colorway}`, and an edit body of: `SegmentedButtons` (static) for status Owned / Wishlist; `SegmentedButtons` (static, `allowDeselect`) for condition Sealed / Boxed / Loose; a `FormGroup` labelled "Acquired" wrapping a native date input; `BuildComments` labelled "Notes". Callbacks: `onUpdateStatus`, `onUpdateCondition`, `onUpdateAcquiredOn`, `onUpdateNotes`, `onToggleFavorite`, `onRemove`, `onEditCommit`.

#### Scenario: Status change

- **WHEN** the user clicks "Wishlist" in the status row
- **THEN** `onUpdateStatus(id, 'wishlist')` is called and the status chip reads "Wishlist"

#### Scenario: Condition deselect

- **WHEN** the active condition button is clicked again
- **THEN** `onUpdateCondition(id, null)` is called and the condition chip is not rendered

#### Scenario: Acquired date

- **WHEN** the user picks a date
- **THEN** `onUpdateAcquiredOn(id, 'YYYY-MM-DD')` is called; clearing the input calls it with `null`

### Requirement: Add device modal

`AddDeviceModal` SHALL be an `AddEntityModal` config wrapper: title "Add Device", entity noun "devices", `searchKeys` `['name', 'line', 'series', 'colorway']`, badges for `line` and `region`; tracked devices are excluded from the pick list.

#### Scenario: Search by line

- **WHEN** the user types "Pendulum"
- **THEN** only devices whose `line`, `series`, `name`, or `colorway` fuzzy-match are listed, excluding already-tracked ones
