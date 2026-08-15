-- Cosmetic display-portrait toggle for characters with an alternate portrait
-- (the Trailblazer path forms). false = default portrait (Stelle), true = alternate (Caelus).
ALTER TABLE hsr_tracked_characters
  ADD COLUMN use_alt_portrait BOOLEAN NOT NULL DEFAULT false;
