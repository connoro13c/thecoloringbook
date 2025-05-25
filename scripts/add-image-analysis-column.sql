-- Add image_analysis column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- Add image_analysis column to pages table  
ALTER TABLE pages ADD COLUMN IF NOT EXISTS image_analysis TEXT;

-- First, check if style_enum exists and add GHIBLI if needed
DO $$ 
BEGIN
    -- Add GHIBLI to style_enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'GHIBLI' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'style_enum')) THEN
        ALTER TYPE style_enum ADD VALUE 'GHIBLI';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If style_enum doesn't exist, create it
        CREATE TYPE style_enum AS ENUM ('CLASSIC', 'GHIBLI', 'BOLD');
END $$;

-- Update the style check constraint to include GHIBLI (if using check constraints instead of enum)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_style_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_style_check CHECK (style IN ('CLASSIC', 'GHIBLI', 'BOLD'));

ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_style_check;
ALTER TABLE pages ADD CONSTRAINT pages_style_check CHECK (style IN ('CLASSIC', 'GHIBLI', 'BOLD'));