-- Find all enum type names that might be related to style
SELECT typname FROM pg_type WHERE typname LIKE '%style%';

-- Check what data actually exists in tables
SELECT DISTINCT style FROM jobs WHERE style IS NOT NULL;

-- Check what data actually exists in pages table  
SELECT DISTINCT style FROM pages WHERE style IS NOT NULL;