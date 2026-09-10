-- Phase 4 (Bangboo): one companion pick per party, stored party-level.
-- Additive and nullable — existing rows and old app code are unaffected.
-- References the static bangboo catalog (wiki entry id), no FK by design:
-- catalog lives in the app bundle, not the DB.
ALTER TABLE zzz_parties ADD COLUMN bangboo_id TEXT;
