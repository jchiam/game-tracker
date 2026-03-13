-- Add build_comments column to tracked_characters table
ALTER TABLE tracked_characters 
ADD COLUMN build_comments TEXT;
