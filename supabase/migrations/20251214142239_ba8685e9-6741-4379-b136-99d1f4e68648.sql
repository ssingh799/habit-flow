-- Add duration column to habit_completions table to store time in seconds
ALTER TABLE public.habit_completions 
ADD COLUMN duration_seconds integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.habit_completions.duration_seconds IS 'Duration in seconds for timed habit completions';