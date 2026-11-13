-- CZN Memory Fragment target-set composition.
--
-- The Target Build's set picks move from two parent columns on
-- czn_tracked_combatants (fragment_set_4_id, fragment_set_2_id — one 4-piece
-- pick and one 2-piece pick) to ordered `target_set` rows in
-- czn_fragment_preferences (stat = set id, no operator, order_index =
-- position), so any legal composition (4+2, 2+2+2, 4, 2+2, 2) is expressible.
-- Steps, in one transaction: widen the category check, copy the existing
-- picks into rows (4-piece first, then 2-piece), drop the columns.

-- 1. Widen the category allowlist. The original constraint carried the
--    Postgres default name; re-add it under an explicit name.
ALTER TABLE czn_fragment_preferences
  DROP CONSTRAINT czn_fragment_preferences_category_check;
ALTER TABLE czn_fragment_preferences
  ADD CONSTRAINT czn_fragment_preferences_category_check
  CHECK (category IN ('slot4_main', 'slot5_main', 'slot6_main', 'sub_stats', 'target_set'));

-- 2. Carry existing picks forward. The 4-piece pick leads at order 0; the
--    2-piece pick follows it, or leads when there is no 4-piece pick.
INSERT INTO czn_fragment_preferences (tracked_combatant_id, category, stat, operator_to_next, order_index)
SELECT id, 'target_set', fragment_set_4_id, NULL, 0
  FROM czn_tracked_combatants
 WHERE fragment_set_4_id IS NOT NULL;

INSERT INTO czn_fragment_preferences (tracked_combatant_id, category, stat, operator_to_next, order_index)
SELECT id, 'target_set', fragment_set_2_id, NULL,
       CASE WHEN fragment_set_4_id IS NULL THEN 0 ELSE 1 END
  FROM czn_tracked_combatants
 WHERE fragment_set_2_id IS NOT NULL;

-- 3. Drop the superseded parent columns.
ALTER TABLE czn_tracked_combatants
  DROP COLUMN fragment_set_4_id,
  DROP COLUMN fragment_set_2_id;
