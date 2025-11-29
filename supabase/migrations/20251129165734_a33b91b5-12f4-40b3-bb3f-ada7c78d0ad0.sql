-- Add weekly_points_reset_date to track when points were last reset
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS weekly_points_reset_date date DEFAULT CURRENT_DATE;

-- Add weekly_mastery_points to track points for current week (separate from all-time)
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS weekly_mastery_points integer NOT NULL DEFAULT 0;