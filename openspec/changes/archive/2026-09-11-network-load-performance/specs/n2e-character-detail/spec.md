## MODIFIED Requirements

### Requirement: Cartridge preferences

The system SHALL track cartridge build preferences per character with four fields: target cartridge ID (string or null, a single named set preference), main stats chain (ordered array of StatPreference), sub stats chain (ordered array of StatPreference), and comments (string or empty). Preferences are persisted atomically through the shared `savePreferenceRows` RPC (see shared-save-behaviour spec).

#### Scenario: Target cartridge set preference saved

- **WHEN** user selects a preferred named cartridge set by name in the preferences tab
- **THEN** `cartridgePreferences.cartridgeId` is immediately set to the S-rarity ID for that set (e.g. selecting "Lost Radiance" saves `"LostRadiance_orange"`) and persisted; no rarity picker is shown because preferences always target S tier

#### Scenario: Target cartridge preference cleared

- **WHEN** user clears the cartridge preference picker
- **THEN** `cartridgePreferences.cartridgeId` is set to null

#### Scenario: Cartridge preferences saved

- **WHEN** user saves cartridge preferences with main and/or sub stat chains
- **THEN** all existing preference rows for the character are deleted and the new rows inserted in order inside one `replace_preference_rows` RPC, so a failure leaves the previous rows in place

#### Scenario: Empty preferences

- **WHEN** no cartridge preferences are set for a character
- **THEN** main stats and sub stats chains are empty arrays, cartridgeId is null; cartridge score returns -1

#### Scenario: Preference comments saved

- **WHEN** user enters comments in the cartridge preferences editor
- **THEN** comments string is persisted with the preference rows
