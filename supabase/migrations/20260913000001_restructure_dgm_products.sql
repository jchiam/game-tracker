-- Digimon (dgm) — restructure tracking around products.
--
-- The tracked entity becomes the product (one release: Digivice -25th COLOR
-- EVOLUTION-, Digital Monster Ver.20th); its colourways and regional editions
-- are variants. A product row carries favorite, notes, and the game-progress
-- item ids; a variant row exists only while the collector has set that
-- variant to owned or wishlist. Ownership is derived, never stored.
--
-- Existing dgm_tracked_devices rows are converted through the device-id →
-- product-id map below (generated from scripts/seeds/dgm-products.json at
-- authoring time), then the old table is dropped. acquired_on is not carried
-- over. The conversion raises on any device id the map does not know, so it
-- fails loudly instead of losing a row.
--
-- Version 20260913000000 on the remote is the abandoned add-dgm-software-progress
-- draft (it created dgm_software_progress, never used by shipped code); that
-- table is dropped here and this migration takes the next version number.

DROP TABLE IF EXISTS dgm_software_progress;

CREATE TABLE dgm_tracked_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  progress TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, product_id)
);

CREATE INDEX idx_dgm_tracked_products_profile ON dgm_tracked_products(profile_id);

CREATE TABLE dgm_tracked_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_product_id UUID NOT NULL REFERENCES dgm_tracked_products(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('owned', 'wishlist')),
  condition TEXT CHECK (condition IN ('sealed', 'boxed', 'loose')),
  UNIQUE (tracked_product_id, variant_id)
);

CREATE INDEX idx_dgm_tracked_variants_product ON dgm_tracked_variants(tracked_product_id);

ALTER TABLE dgm_tracked_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dgm_tracked_variants ENABLE ROW LEVEL SECURITY;

-- auth.uid() wrapped as a scalar subquery so the planner evaluates it once per
-- statement (see 20260911000001_rls_policies_cache_auth_uid.sql).
CREATE POLICY "Users can view own tracked products"
  ON dgm_tracked_products FOR SELECT
  USING (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert own tracked products"
  ON dgm_tracked_products FOR INSERT
  WITH CHECK (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own tracked products"
  ON dgm_tracked_products FOR UPDATE
  USING (profile_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own tracked products"
  ON dgm_tracked_products FOR DELETE
  USING (profile_id = (SELECT auth.uid())::text);

-- Variant rows are reached through their product's ownership (the HSR relic pattern).
CREATE POLICY "Users can view own tracked variants"
  ON dgm_tracked_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM dgm_tracked_products p
    WHERE p.id = dgm_tracked_variants.tracked_product_id
      AND p.profile_id = (SELECT auth.uid())::text
  ));

CREATE POLICY "Users can insert own tracked variants"
  ON dgm_tracked_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM dgm_tracked_products p
    WHERE p.id = dgm_tracked_variants.tracked_product_id
      AND p.profile_id = (SELECT auth.uid())::text
  ));

CREATE POLICY "Users can update own tracked variants"
  ON dgm_tracked_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM dgm_tracked_products p
    WHERE p.id = dgm_tracked_variants.tracked_product_id
      AND p.profile_id = (SELECT auth.uid())::text
  ));

CREATE POLICY "Users can delete own tracked variants"
  ON dgm_tracked_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM dgm_tracked_products p
    WHERE p.id = dgm_tracked_variants.tracked_product_id
      AND p.profile_id = (SELECT auth.uid())::text
  ));

-- ---------------------------------------------------------------------------
-- Convert existing device rows.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  unmapped TEXT;
BEGIN
  CREATE TEMP TABLE dgm_device_product_map (device_id TEXT PRIMARY KEY, product_id TEXT NOT NULL)
    ON COMMIT DROP;
  INSERT INTO dgm_device_product_map (device_id, product_id) VALUES
    ('dm-ver20th-original-brown', 'dm-ver-20th'),
    ('dm-ver20th-original-gray', 'dm-ver-20th'),
    ('dm-ver20th-original-navy-blue', 'dm-ver-20th'),
    ('dm-ver20th-original-yellow', 'dm-ver-20th'),
    ('dm-ver20th-omegamon-color', 'dm-ver-20th'),
    ('dm-ver20th-alphamon-color', 'dm-ver-20th'),
    ('dm-ver20th-english-brick', 'dm-ver-20th'),
    ('dm-ver20th-english-gray', 'dm-ver-20th'),
    ('dm-x-ver1-black', 'dm-x-ver-1'),
    ('dm-x-ver1-white', 'dm-x-ver-1'),
    ('dm-x-ver1-black-and-red', 'dm-x-ver-1'),
    ('dm-x-ver1-white-and-blue', 'dm-x-ver-1'),
    ('dm-x-ver1-purple-and-red', 'dm-x-ver-1'),
    ('dm-x-ver1-green-and-blue', 'dm-x-ver-1'),
    ('dm-x-ver2-red', 'dm-x-ver-2'),
    ('dm-x-ver2-purple', 'dm-x-ver-2'),
    ('dm-x-ver2-translucent-red-and-gold', 'dm-x-ver-2'),
    ('dm-x-ver2-translucent-purple-and-silver', 'dm-x-ver-2'),
    ('dm-x-ver2-metallic-navy-and-silver', 'dm-x-ver-2'),
    ('dm-x-ver2-metallic-grey-and-gold', 'dm-x-ver-2'),
    ('dm-x-ver3-yellow', 'dm-x-ver-3'),
    ('dm-x-ver3-blue', 'dm-x-ver-3'),
    ('dm-color-ver1-original-brown', 'dm-color-ver-1'),
    ('dm-color-ver1-original-gray', 'dm-color-ver-1'),
    ('dm-color-ver2-original-white', 'dm-color-ver-2'),
    ('dm-color-ver2-original-black', 'dm-color-ver-2'),
    ('dm-color-ver3-original-purple', 'dm-color-ver-3'),
    ('dm-color-ver4-original-clear-red', 'dm-color-ver-4'),
    ('dm-color-ver5-original-clear-green', 'dm-color-ver-5'),
    ('dm-color-monster-hunter-liolaeus', 'dm-color-monster-hunter-20th-edition'),
    ('dm-color-monster-hunter-zinogre', 'dm-color-monster-hunter-20th-edition'),
    ('dm-color-godzilla-g-erosion', 'dm-color-godzilla-70th-edition'),
    ('dm-color-godzilla-g-erosion-classic', 'dm-color-godzilla-70th-edition'),
    ('dm-color-xros-wars-xros-heart', 'dm-color-digimon-xros-wars-15th-edition'),
    ('dm-color-xros-wars-blue-flare', 'dm-color-digimon-xros-wars-15th-edition'),
    ('dm-color-ultraman-henshin', 'dm-color-ultraman-series-60th-edition'),
    ('dm-color-ultraman-graffiti-ultraheroes', 'dm-color-ultraman-series-60th-edition'),
    ('pen-ver20th-original-silver-black', 'pen-ver-20th'),
    ('pen-ver20th-original-silver-blue', 'pen-ver-20th'),
    ('pen-ver20th-dukemon-color', 'pen-ver-20th'),
    ('pen-ver20th-beelzebumon-color', 'pen-ver-20th'),
    ('pen-z-nature-spirits', 'pen-z'),
    ('pen-z-deep-savers', 'pen-z'),
    ('pen-z-nightmare-soldiers', 'pen-z'),
    ('pen-z2-wind-guardians', 'pen-z-ii'),
    ('pen-z2-metal-empire', 'pen-z-ii'),
    ('pen-z2-virus-busters', 'pen-z-ii'),
    ('pen-color-1-nature-spirits', 'pen-color-1-nature-spirits'),
    ('pen-color-2-deep-savers', 'pen-color-2-deep-savers'),
    ('pen-color-3-nightmare-soldiers', 'pen-color-3-nightmare-soldiers'),
    ('pen-color-4-wind-guardians', 'pen-color-4-wind-guardians'),
    ('pen-color-5-metal-empire', 'pen-color-5-metal-empire'),
    ('pen-color-zero-virus-busters', 'pen-color-zero-virus-busters'),
    ('pen-color-6-saiyu-warriors', 'pen-color-6-saiyu-warriors'),
    ('pen-color-7-toho-braves', 'pen-color-7-toho-braves'),
    ('pen-color-8-celestial-walker', 'pen-color-8-celestial-walker'),
    ('pen-color-9-astral-sentinel', 'pen-color-9-astral-sentinel'),
    ('pen-color-godzilla-side-godzilla', 'pen-color-godzilla-edition'),
    ('pen-color-godzilla-side-digimon', 'pen-color-godzilla-edition'),
    ('vb-digital-monster-ver-black', 'vb-digital-monster'),
    ('vb-digital-monster-ver-white', 'vb-digital-monster'),
    ('vb-digital-monster-ver-special', 'vb-digital-monster'),
    ('vb-digivice-v', 'vb-digivice-v'),
    ('vb-vital-hero-ver-black', 'vb-vital-hero'),
    ('vb-be-clear-black', 'vb-be'),
    ('vb-be-clear-white', 'vb-be'),
    ('vb-be-25th-anniversary-set', 'vb-be'),
    ('vb-be-digivice-vv', 'vb-be-digivice-vv'),
    ('dv-ver15th-yagami-taichi', 'dv-ver-15th'),
    ('dv-ver15th-ishida-yamato', 'dv-ver-15th'),
    ('dv-2020-blue', 'dv-digivice'),
    ('dv-ver-complete', 'dv-ver-complete'),
    ('dv-25th-anime-original', 'dv-25th-color-evolution'),
    ('dv-25th-yagami-taichi', 'dv-25th-color-evolution'),
    ('dv-25th-ishida-yamato', 'dv-25th-color-evolution'),
    ('d3-ver15th-motomiya-daisuke', 'd3-ver-15th'),
    ('d3-ver15th-ichijouji-ken', 'd3-ver-15th'),
    ('d3-ver15th-paildramon', 'd3-ver-15th'),
    ('d3-25th-motomiya-daisuke', 'd3-25th-color-evolution'),
    ('d3-25th-ichijouji-ken', 'd3-25th-color-evolution'),
    ('d3-25th-paildramon', 'd3-25th-color-evolution'),
    ('dark-ver15th-matsuda-takato', 'dark-ver-15th'),
    ('dark-ver15th-makino-ruki', 'dark-ver-15th'),
    ('dark-25th-matsuda-takato', 'dark-25th-color-evolution'),
    ('dark-25th-lee-jianliang', 'dark-25th-color-evolution'),
    ('dark-25th-makino-ruki', 'dark-25th-color-evolution'),
    ('xl-original-red', 'xl-original'),
    ('xl-black-color-ver', 'xl-black-color-ver'),
    ('xl-blue-flare-side', 'xl-blue-flare-side');

  SELECT string_agg(DISTINCT d.device_id, ', ') INTO unmapped
    FROM dgm_tracked_devices d
    LEFT JOIN dgm_device_product_map m ON m.device_id = d.device_id
    WHERE m.device_id IS NULL;
  IF unmapped IS NOT NULL THEN
    RAISE EXCEPTION 'dgm_tracked_devices has device ids with no product mapping: %', unmapped;
  END IF;

  INSERT INTO dgm_tracked_products (profile_id, product_id, is_favorited, notes, created_at)
    SELECT d.profile_id,
           m.product_id,
           bool_or(d.is_favorited),
           coalesce(string_agg(nullif(d.notes, ''), E'
' ORDER BY d.created_at), ''),
           min(d.created_at)
      FROM dgm_tracked_devices d
      JOIN dgm_device_product_map m ON m.device_id = d.device_id
     GROUP BY d.profile_id, m.product_id;

  INSERT INTO dgm_tracked_variants (tracked_product_id, variant_id, status, condition)
    SELECT p.id, d.device_id, d.status, d.condition
      FROM dgm_tracked_devices d
      JOIN dgm_device_product_map m ON m.device_id = d.device_id
      JOIN dgm_tracked_products p ON p.profile_id = d.profile_id AND p.product_id = m.product_id;
END $$;

DROP TABLE dgm_tracked_devices;
