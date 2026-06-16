## Purpose

Image URL resolution for the game tracker. Converts local `/assets/` paths to ImageKit CDN URLs with on-the-fly transforms. Falls back to local paths when ImageKit is not configured.

## Requirements

### Requirement: ImageKit CDN URL resolution

The system SHALL resolve local asset paths to ImageKit CDN URLs when `VITE_IMAGEKIT_URL_ENDPOINT` is configured.

#### Scenario: ImageKit configured

- **WHEN** `VITE_IMAGEKIT_URL_ENDPOINT` is set and non-empty
- **THEN** image helper functions return fully-formed ImageKit URLs

#### Scenario: ImageKit not configured

- **WHEN** `VITE_IMAGEKIT_URL_ENDPOINT` is empty or absent
- **THEN** image helper functions return the original local `/assets/...` path as fallback

### Requirement: Local path to ImageKit path conversion

The system SHALL convert local asset paths to ImageKit-compatible paths by stripping the `/assets` prefix and replacing hyphens in directory name segments with underscores (ImageKit folder naming constraint). Filename segments SHALL be left unchanged.

#### Scenario: Directory hyphens replaced

- **WHEN** local path is `/assets/reverse-1999/arcanists/foo.webp`
- **THEN** ImageKit path is `/reverse_1999/arcanists/foo.webp`

#### Scenario: Filename preserved

- **WHEN** local path is `/assets/honkai-star-rail/characters/some-char.webp`
- **THEN** filename `some-char.webp` is not modified

### Requirement: Mugshot URL with top-anchored square crop

The system SHALL return an ImageKit URL with a top-anchored 1:1 aspect ratio crop for arcanist mugshot images.

#### Scenario: Mugshot URL

- **WHEN** `getMugshotUrl` is called with a local path
- **THEN** returned URL includes transform `tr:fo-top,ar-1-1`

### Requirement: Avatar URL with face-centred crop at 128px

The system SHALL return an ImageKit URL with a face-centred 128×128 crop for small avatar images (e.g. modal list items).

#### Scenario: Avatar URL

- **WHEN** `getAvatarUrl` is called with a local path
- **THEN** returned URL includes transform `tr:w-128,h-128,fo-face,c-at_max`

### Requirement: Psychube icon URL without crop transform

The system SHALL return an ImageKit URL with no crop transform for psychube icons, which are already square artwork.

#### Scenario: Psychube URL

- **WHEN** `getPsychubeUrl` is called with a local path
- **THEN** returned URL contains the ImageKit endpoint and converted path with no transform segment
