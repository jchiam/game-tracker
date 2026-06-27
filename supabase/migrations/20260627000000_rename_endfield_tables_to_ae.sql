-- Normalise Arknights: Endfield table names from the `endfield_` prefix to the
-- short game id `ae_`, matching the hsr_/r1999_/n2e_ convention. Data preserved.
-- Auto-generated constraint names (pkey, FK, unique, check) keep their original
-- `endfield_` prefix — they are cosmetic and not referenced by application code.

BEGIN;

-- Tables
ALTER TABLE endfield_tracked_operators RENAME TO ae_tracked_operators;
ALTER TABLE endfield_parties RENAME TO ae_parties;
ALTER TABLE endfield_party_members RENAME TO ae_party_members;

-- Explicitly named indexes
ALTER INDEX idx_endfield_tracked_operators_profile RENAME TO idx_ae_tracked_operators_profile;
ALTER INDEX idx_endfield_parties_profile RENAME TO idx_ae_parties_profile;
ALTER INDEX idx_endfield_party_members_party RENAME TO idx_ae_party_members_party;

COMMIT;
