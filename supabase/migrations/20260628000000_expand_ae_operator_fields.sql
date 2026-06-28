-- Expand Arknights: Endfield tracked-operator fields for the reworked operator card.
--
-- Rename `potential` to `phase`: this is data-preserving but REINTERPRETS existing
-- `potential` values (0–5) as `phase` (0–5). The two share the same range/semantics
-- for this app, so stored rows are kept as-is under the new name — not a pure no-op.
--
-- Add `skills_maxed` (HSR-traces-style all-or-nothing flag), and the equipped-weapon
-- fields `weapon_name` (display name from ALL_WEAPONS) + `weapon_level` (1–90).

BEGIN;

ALTER TABLE ae_tracked_operators RENAME COLUMN potential TO phase;

ALTER TABLE ae_tracked_operators
  ADD COLUMN skills_maxed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN weapon_name TEXT,
  ADD COLUMN weapon_level INTEGER NOT NULL DEFAULT 1;

COMMIT;
