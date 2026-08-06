-- Adds a per-character "modules configured" flag to N2E tracked characters.
-- Modules are a distinct N2E progression system tracked here as a single done/not-done boolean
-- (mirrors HSR's traces_attained flag). Column on an existing RLS-enabled table — no policy change.

ALTER TABLE n2e_tracked_characters
  ADD COLUMN modules_configured BOOLEAN NOT NULL DEFAULT false;
