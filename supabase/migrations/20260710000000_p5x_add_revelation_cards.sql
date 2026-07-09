-- Revelation Cards: per-thief per-slot equipped card (5 slots max)
CREATE TABLE p5x_revelation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thief_row_id UUID NOT NULL REFERENCES p5x_tracked_thieves(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('sun', 'moon', 'star', 'sky', 'space')),
  set_id TEXT,
  main_stat TEXT,
  sub_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (thief_row_id, slot)
);

ALTER TABLE p5x_revelation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own revelation cards"
  ON p5x_revelation_cards
  FOR ALL
  USING (
    thief_row_id IN (
      SELECT id FROM p5x_tracked_thieves WHERE profile_id = auth.uid()::text
    )
  )
  WITH CHECK (
    thief_row_id IN (
      SELECT id FROM p5x_tracked_thieves WHERE profile_id = auth.uid()::text
    )
  );

CREATE INDEX idx_p5x_revelation_cards_thief ON p5x_revelation_cards(thief_row_id);
