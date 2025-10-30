-- Migration script to update existing PortfolAI database
-- Run this if you already have the database set up

-- Add new columns to meetings table
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS personal_notes JSONB DEFAULT '[]'::jsonb;

-- Change sentiment from VARCHAR to INTEGER
-- First, add new column
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 10);

-- Migrate existing sentiment values to numeric scale
UPDATE meetings
SET sentiment_score = CASE
  WHEN sentiment = 'positive' THEN 8
  WHEN sentiment = 'neutral' THEN 5
  WHEN sentiment = 'negative' THEN 2
  ELSE 5
END
WHERE sentiment_score IS NULL;

-- Drop old sentiment column and rename new one
ALTER TABLE meetings DROP COLUMN IF EXISTS sentiment;
ALTER TABLE meetings RENAME COLUMN sentiment_score TO sentiment;

-- Done!
SELECT 'Migration completed successfully!' AS status;
