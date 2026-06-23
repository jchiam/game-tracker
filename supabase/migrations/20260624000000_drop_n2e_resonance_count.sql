-- Drop resonance_count column from n2e_tracked_characters
-- "Resonance count" has no counterpart in the Neverness to Everness game and is
-- unused by scoring or any other feature; it was a leftover from scaffolding the
-- N2E module off the R1999 template. See change: remove-n2e-resonance.

ALTER TABLE n2e_tracked_characters
DROP COLUMN resonance_count;
