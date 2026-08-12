## ADDED Requirements

### Requirement: Light cone icon URL without crop transform

The system SHALL return an ImageKit URL with no crop transform for HSR light cone icons, which are already square artwork. When ImageKit is not configured, the raw local path SHALL be returned unchanged.

#### Scenario: Light cone URL

- **WHEN** `getLightConeUrl` is called with a local path
- **THEN** returned URL contains the ImageKit endpoint and converted path with no transform segment

#### Scenario: ImageKit not configured

- **WHEN** `getLightConeUrl` is called and no ImageKit endpoint is configured
- **THEN** the local path is returned unchanged
