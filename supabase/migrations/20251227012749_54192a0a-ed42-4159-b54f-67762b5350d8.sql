-- Add previous_challenge_id to track revenge matches
ALTER TABLE public.challenges 
ADD COLUMN previous_challenge_id uuid REFERENCES public.challenges(id);

-- Add index for performance
CREATE INDEX idx_challenges_previous_challenge ON public.challenges(previous_challenge_id) WHERE previous_challenge_id IS NOT NULL;