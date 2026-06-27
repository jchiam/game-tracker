## REMOVED Requirements

### Requirement: Resonance count field

**Reason**: "Resonance count" has no counterpart in the Neverness to Everness game. It is not part of the auto-generated character catalog, is never fetched by the data update script, and is not consumed by the cartridge progress score — it only drives a color gradient and duplicates the 0–6 range of the real `awakening` mechanic. It is a leftover from scaffolding the N2E module off the R1999 template (where `resonanceLevel` is a genuine mechanic).

**Migration**: No user action required. The `resonance_count` column is dropped from `n2e_tracked_characters` and any stored values are discarded. No feature, score, or other capability depends on this field.
