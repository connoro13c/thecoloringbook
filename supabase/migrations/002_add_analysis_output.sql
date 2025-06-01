-- Add analysis_output column to store photo analysis results for debugging
alter table public.pages 
add column analysis_output jsonb;

-- Add a comment to explain the column purpose
comment on column public.pages.analysis_output is 'Stores the raw photo analysis output from GPT-4o Vision for debugging and analysis';
