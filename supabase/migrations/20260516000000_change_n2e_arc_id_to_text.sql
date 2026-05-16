-- Change arc_id from INTEGER to TEXT to support string-based arc IDs from everness.info API

ALTER TABLE n2e_tracked_characters ALTER COLUMN arc_id TYPE TEXT USING arc_id::TEXT;
