-- Psychube IDs are being fully reassigned (new source: Fandom Wiki, ~150 entries).
-- Existing selections referenced the old 35-entry kornblume list and are no longer valid.
UPDATE r1999_tracked_arcanists
SET psychube_id = NULL,
    psychube_level = 1,
    psychube_amplification = 0
WHERE psychube_id IS NOT NULL;
