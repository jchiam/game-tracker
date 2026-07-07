-- Restructure P5X party members for the Wonder + personas + thieves model.
--
-- P5X parties are not freeform 4-slot teams. Each party is Wonder (implicit,
-- never stored) equipped with up to 3 personas (slots 1–3) plus 3 thieves
-- (slots 4–6). This migration widens the slot range, adds a member_type
-- discriminator, and renames thief_id → entity_id (personas and thieves both
-- live in this column, disambiguated by member_type).
--
-- Destructive (user-approved): existing P5X parties assume the old 0–3 uniform
-- slot model and cannot be mapped forward, so they are purged first.

DELETE FROM p5x_party_members;
DELETE FROM p5x_parties;

ALTER TABLE p5x_party_members
  DROP CONSTRAINT p5x_party_members_slot_index_check;

ALTER TABLE p5x_party_members
  ADD CONSTRAINT p5x_party_members_slot_index_check
  CHECK (slot_index >= 1 AND slot_index <= 6);

ALTER TABLE p5x_party_members
  ADD COLUMN member_type TEXT NOT NULL DEFAULT 'thief'
  CHECK (member_type IN ('thief', 'persona'));

ALTER TABLE p5x_party_members
  RENAME COLUMN thief_id TO entity_id;
