-- Check current enum values
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'style_enum');

-- Check what style values exist in jobs table
SELECT DISTINCT style FROM jobs;

-- Check what style values exist in pages table  
SELECT DISTINCT style FROM pages;

-- Check if style_enum type exists
SELECT typname FROM pg_type WHERE typname = 'style_enum';
