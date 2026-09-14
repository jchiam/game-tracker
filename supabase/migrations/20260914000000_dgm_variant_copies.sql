-- Digimon (dgm) — variant rows hold copy counts per condition.
--
-- A collector can own several copies of one variant (one sealed on the shelf,
-- one loose in play, sometimes two sealed) and may still want another. The
-- exclusive status / condition pair cannot say that, so a variant row now
-- carries an independent wishlist flag plus one counter per condition
-- (sealed / boxed / loose). Ownership stays derived: owned = any counter > 0.
--
-- Backfill of existing rows: status = 'wishlist' becomes wishlist = true with
-- every counter 0; status = 'owned' becomes one copy in its condition bucket.
-- An owned row with a NULL condition is counted as one LOOSE copy — the lowest
-- completeness tier, so it never over-claims, and it keeps the product
-- playable the way the old model allowed. Every count is one tap away in the
-- editor if that assumption is wrong for a row.
--
-- The unique (tracked_product_id, variant_id) key, the index, and the RLS
-- policies (reached through the parent product) are untouched.

ALTER TABLE dgm_tracked_variants
  ADD COLUMN wishlist BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN sealed INTEGER NOT NULL DEFAULT 0 CHECK (sealed >= 0),
  ADD COLUMN boxed INTEGER NOT NULL DEFAULT 0 CHECK (boxed >= 0),
  ADD COLUMN loose INTEGER NOT NULL DEFAULT 0 CHECK (loose >= 0);

UPDATE dgm_tracked_variants SET
  wishlist = (status = 'wishlist'),
  sealed = CASE WHEN status = 'owned' AND condition = 'sealed' THEN 1 ELSE 0 END,
  boxed = CASE WHEN status = 'owned' AND condition = 'boxed' THEN 1 ELSE 0 END,
  loose = CASE WHEN status = 'owned' AND (condition = 'loose' OR condition IS NULL) THEN 1 ELSE 0 END;

ALTER TABLE dgm_tracked_variants
  DROP COLUMN status,
  DROP COLUMN condition;

-- A row exists only while it means something: wishlisted, or at least one copy.
-- The client deletes the row instead of writing an empty one; this makes the
-- database refuse an empty row too.
ALTER TABLE dgm_tracked_variants
  ADD CONSTRAINT dgm_tracked_variants_meaningful
  CHECK (wishlist OR sealed + boxed + loose > 0);
