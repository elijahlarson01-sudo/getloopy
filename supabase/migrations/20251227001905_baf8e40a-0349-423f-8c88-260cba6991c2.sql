-- Create challenge status enum
CREATE TYPE public.challenge_status AS ENUM ('pending', 'completed');

-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_user_id UUID NOT NULL,
  opponent_user_id UUID NOT NULL,
  cohort_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  stake_points INTEGER NOT NULL CHECK (stake_points > 0),
  status challenge_status NOT NULL DEFAULT 'pending',
  winner_user_id UUID,
  is_draw BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_users CHECK (challenger_user_id != opponent_user_id)
);

-- Create challenge_attempts table
CREATE TABLE public.challenge_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  seconds_used NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Users can view challenges in their cohort"
ON public.challenges
FOR SELECT
USING (
  cohort_id IN (
    SELECT cohort_id FROM public.user_onboarding WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create challenges"
ON public.challenges
FOR INSERT
WITH CHECK (auth.uid() = challenger_user_id);

CREATE POLICY "Users can update their own challenges"
ON public.challenges
FOR UPDATE
USING (auth.uid() = challenger_user_id OR auth.uid() = opponent_user_id);

-- RLS Policies for challenge_attempts
CREATE POLICY "Users can view attempts for challenges they're part of"
ON public.challenge_attempts
FOR SELECT
USING (
  challenge_id IN (
    SELECT id FROM public.challenges 
    WHERE challenger_user_id = auth.uid() OR opponent_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own attempts"
ON public.challenge_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for challenges
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_attempts;