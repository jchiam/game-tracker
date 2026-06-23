## ADDED Requirements

### Requirement: Update script uploads HSR characters to ImageKit

The update script (`scripts/update-hsr-data.mjs`) SHALL upload each downloaded character portrait to ImageKit at `/honkai_star_rail/characters/{id}.webp` after the download phase. Upload SHALL be skipped for files already present on ImageKit (idempotent). The local path stored in `characters.ts` SHALL remain unchanged (`/assets/honkai-star-rail/characters/{id}.webp`).

#### Scenario: New character uploaded

- **WHEN** the update script runs and a character portrait is not yet on ImageKit
- **THEN** the portrait is uploaded to `/honkai_star_rail/characters/{id}.webp` on ImageKit

#### Scenario: Existing character skipped

- **WHEN** the update script runs and a character portrait already exists on ImageKit
- **THEN** the upload is skipped and the script logs that it was skipped

#### Scenario: Local path unchanged

- **WHEN** the update script runs
- **THEN** `src/data/honkai-star-rail/characters.ts` continues to store local paths (`/assets/honkai-star-rail/characters/{id}.webp`)

### Requirement: Update script uploads HSR relics to ImageKit

The update script SHALL upload each downloaded relic icon to ImageKit at `/honkai_star_rail/relics/{id}.{ext}` after the download phase. Upload SHALL be skipped for files already present on ImageKit (idempotent). The local path stored in `relic_sets.ts` SHALL remain unchanged.

#### Scenario: New relic uploaded

- **WHEN** the update script runs and a relic icon is not yet on ImageKit
- **THEN** the icon is uploaded to `/honkai_star_rail/relics/{id}.{ext}` on ImageKit

#### Scenario: Existing relic skipped

- **WHEN** the update script runs and a relic icon already exists on ImageKit
- **THEN** the upload is skipped

### Requirement: imagekit.ts exposes getRelicIconUrl

`src/lib/imagekit.ts` SHALL export a `getRelicIconUrl(localPath: string): string` function. When `VITE_IMAGEKIT_URL` is set, it SHALL resolve the local path to an ImageKit CDN URL with no image transforms. When `VITE_IMAGEKIT_URL` is not set, it SHALL return the local path unchanged.

#### Scenario: ImageKit configured

- **WHEN** `VITE_IMAGEKIT_URL` is set and `getRelicIconUrl('/assets/honkai-star-rail/relics/101.png')` is called
- **THEN** it returns an ImageKit CDN URL for that path with no transform parameters

#### Scenario: ImageKit not configured

- **WHEN** `VITE_IMAGEKIT_URL` is not set and `getRelicIconUrl('/assets/honkai-star-rail/relics/101.png')` is called
- **THEN** it returns `/assets/honkai-star-rail/relics/101.png` unchanged

### Requirement: CharacterCard resolves character portrait via getMugshotUrl

`CharacterCard.tsx` SHALL wrap `char.imageUrl` with `getMugshotUrl()` when rendering the character portrait image, replacing the current raw path usage.

#### Scenario: Character portrait rendered

- **WHEN** a CharacterCard renders a character with a local imageUrl
- **THEN** the `<img>` src is the result of `getMugshotUrl(char.imageUrl)`

### Requirement: CharacterCard resolves relic icon via getRelicIconUrl

`CharacterCard.tsx` SHALL wrap `set.icon` with `getRelicIconUrl()` when rendering relic icons in the relic grid, replacing the current inline URL construction logic (including the GitHub raw URL fallback).

#### Scenario: Relic icon rendered

- **WHEN** a CharacterCard renders a relic slot with a known relic set
- **THEN** the `<img>` src is the result of `getRelicIconUrl(set.icon)`

#### Scenario: GitHub raw fallback removed

- **WHEN** `set.icon` is a local path (starts with `/`)
- **THEN** no GitHub raw URL is constructed; `getRelicIconUrl` handles resolution

### Requirement: Local HSR image files removed from repo

After ImageKit upload is confirmed, `public/assets/honkai-star-rail/characters/` and `public/assets/honkai-star-rail/relics/` SHALL be deleted from the repository. `public/assets/honkai-star-rail/selection-cover.png` SHALL be retained.

#### Scenario: Characters directory removed

- **WHEN** migration is complete
- **THEN** `public/assets/honkai-star-rail/characters/` does not exist in the repo

#### Scenario: Relics directory removed

- **WHEN** migration is complete
- **THEN** `public/assets/honkai-star-rail/relics/` does not exist in the repo

#### Scenario: Selection cover retained

- **WHEN** migration is complete
- **THEN** `public/assets/honkai-star-rail/selection-cover.png` still exists
