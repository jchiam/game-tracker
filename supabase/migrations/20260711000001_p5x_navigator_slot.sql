-- Add the P5X Navigator slot (slot_index 7) to party members.
--
-- P5X combat fields Wonder (implicit) + up to 3 personas (slots 1–3) + up to 3
-- active thieves (slots 4–6) + one Navigator (slot 7). The Navigator is an
-- off-field support unit — a distinct subset of the thief roster
-- (role = 'Navigator') that can only occupy this dedicated slot.
--
-- Forward-only, strictly permissive: existing rows (slots 1–6, member_type
-- persona/thief) remain valid under the widened constraints, so no row rewrite
-- is needed.

-- slot_index: the constraint name is already established (the party-restructure
-- migration dropped it by this exact name), so drop it explicitly.
ALTER TABLE p5x_party_members
  DROP CONSTRAINT p5x_party_members_slot_index_check;

ALTER TABLE p5x_party_members
  ADD CONSTRAINT p5x_party_members_slot_index_check
  CHECK (slot_index >= 1 AND slot_index <= 7);

-- member_type: this CHECK was created inline on ADD COLUMN in the party-restructure
-- migration, so its auto-generated name has never been exercised. Rather than
-- assume the Postgres convention (`<table>_<column>_check`), look it up in
-- pg_constraint and drop whichever CHECK governs member_type — name-agnostic.
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'p5x_party_members'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%member_type%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE p5x_party_members DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE p5x_party_members
  ADD CONSTRAINT p5x_party_members_member_type_check
  CHECK (member_type IN ('thief', 'persona', 'navigator'));
