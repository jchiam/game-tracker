-- Chaos Zero Nightmare Phase 3: Memory Fragments (the relic analog) — equipped
-- pieces, piece substats, build-preference rows, and target-set/comments
-- columns on the tracked-combatants parent. The ZZZ Drive Disc tables
-- (20260817000000) renamed for CZN:
--   czn_equipped_fragments   one row per combatant + slot (1–6); slots 1–3 carry
--                            fixed mains, 4–6 variable; set_id is an
--                            ALL_CZN_FRAGMENT_SETS id (kebab slug of the name)
--   czn_fragment_substats    stat names only — no values, rarity, or level
--   czn_fragment_preferences single-table category chains: slot4_main /
--                            slot5_main / slot6_main / sub_stats
-- Writes go through the shared upsert_equipment_slot and
-- replace_preference_rows RPCs; assert_game_table already allows `czn_*`
-- (20261109000000). Policies use the cached `(select auth.uid())` form the
-- 2026-09-11 linter pass standardised on.

BEGIN;

-- Set picks and comments live on the parent row (single-select scalars);
-- preference chains live in czn_fragment_preferences.
ALTER TABLE czn_tracked_combatants
  ADD COLUMN fragment_set_4_id TEXT,
  ADD COLUMN fragment_set_2_id TEXT,
  ADD COLUMN fragment_comments TEXT;

-- Equipped Memory Fragments
CREATE TABLE czn_equipped_fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_combatant_id UUID NOT NULL REFERENCES czn_tracked_combatants(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot BETWEEN 1 AND 6),
  set_id TEXT,
  main_stat TEXT,
  UNIQUE (tracked_combatant_id, slot)
);

CREATE INDEX idx_czn_equipped_fragments_combatant ON czn_equipped_fragments(tracked_combatant_id);

ALTER TABLE czn_equipped_fragments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own equipped fragments"
  ON czn_equipped_fragments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can insert own equipped fragments"
  ON czn_equipped_fragments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can update own equipped fragments"
  ON czn_equipped_fragments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can delete own equipped fragments"
  ON czn_equipped_fragments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

-- Fragment substats (stat names only — HSR / ZZZ precedent)
CREATE TABLE czn_fragment_substats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fragment_id UUID NOT NULL REFERENCES czn_equipped_fragments(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL
);

CREATE INDEX idx_czn_fragment_substats_fragment ON czn_fragment_substats(fragment_id);

ALTER TABLE czn_fragment_substats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fragment substats"
  ON czn_fragment_substats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM czn_equipped_fragments f
    JOIN czn_tracked_combatants c ON c.id = f.tracked_combatant_id
    WHERE f.id = fragment_id AND c.profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can insert own fragment substats"
  ON czn_fragment_substats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM czn_equipped_fragments f
    JOIN czn_tracked_combatants c ON c.id = f.tracked_combatant_id
    WHERE f.id = fragment_id AND c.profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can update own fragment substats"
  ON czn_fragment_substats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM czn_equipped_fragments f
    JOIN czn_tracked_combatants c ON c.id = f.tracked_combatant_id
    WHERE f.id = fragment_id AND c.profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can delete own fragment substats"
  ON czn_fragment_substats FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM czn_equipped_fragments f
    JOIN czn_tracked_combatants c ON c.id = f.tracked_combatant_id
    WHERE f.id = fragment_id AND c.profile_id = (select auth.uid())::text
  ));

-- Fragment build-preference chains (single-table category shape, ZZZ precedent)
CREATE TABLE czn_fragment_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_combatant_id UUID NOT NULL REFERENCES czn_tracked_combatants(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('slot4_main', 'slot5_main', 'slot6_main', 'sub_stats')),
  stat TEXT NOT NULL,
  operator_to_next TEXT CHECK (operator_to_next IN ('>', '>=', 'OR')),
  order_index INTEGER NOT NULL
);

CREATE INDEX idx_czn_fragment_preferences_combatant ON czn_fragment_preferences(tracked_combatant_id);

ALTER TABLE czn_fragment_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fragment preferences"
  ON czn_fragment_preferences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can insert own fragment preferences"
  ON czn_fragment_preferences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can update own fragment preferences"
  ON czn_fragment_preferences FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

CREATE POLICY "Users can delete own fragment preferences"
  ON czn_fragment_preferences FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM czn_tracked_combatants
    WHERE id = tracked_combatant_id AND profile_id = (select auth.uid())::text
  ));

COMMIT;
