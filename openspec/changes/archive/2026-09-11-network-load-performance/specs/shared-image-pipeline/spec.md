## MODIFIED Requirements

### Requirement: Mugshot URL with top-anchored square crop

The system SHALL return an ImageKit URL for card mugshot images that applies a top-anchored 1:1 crop and then caps the side at 480 px without upscaling (`c-at_max`), so sources smaller than 480 px are served byte-identical and larger sources shrink to display size. `getMugshotUrl` and `getPersonaMugshotUrl` SHALL share this transform.

#### Scenario: Mugshot URL

- **WHEN** `getMugshotUrl` is called with a local path
- **THEN** returned URL includes the chained transform `tr:fo-top,ar-1-1:w-480,c-at_max`

#### Scenario: Small source not inflated

- **WHEN** the stored source is narrower than 480 px (e.g. a 256 px HSR portrait)
- **THEN** the CDN returns it at its native size rather than upscaled
