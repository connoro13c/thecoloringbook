-- First, drop any existing style constraints that might conflict
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_style_check;
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_style_check;

-- Add image_analysis column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- Add image_analysis column to pages table  
ALTER TABLE pages ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- Now add the updated constraints that include GHIBLI
ALTER TABLE jobs ADD CONSTRAINT jobs_style_check CHECK (style IN ('CLASSIC', 'GHIBLI', 'BOLD'));
ALTER TABLE pages ADD CONSTRAINT pages_style_check CHECK (style IN ('CLASSIC', 'GHIBLI', 'BOLD'));