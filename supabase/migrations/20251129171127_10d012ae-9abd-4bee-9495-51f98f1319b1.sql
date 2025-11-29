-- Create cohorts table (groups of users studying same degree)
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  degree_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

-- Anyone can view cohorts (for leaderboard)
CREATE POLICY "Anyone can view cohorts"
ON public.cohorts FOR SELECT
USING (true);

-- Create user onboarding table
CREATE TABLE public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  motivation TEXT,
  is_studying_degree BOOLEAN DEFAULT false,
  cohort_id UUID REFERENCES public.cohorts(id),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding data
CREATE POLICY "Users can view their own onboarding"
ON public.user_onboarding FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own onboarding data
CREATE POLICY "Users can insert their own onboarding"
ON public.user_onboarding FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own onboarding data
CREATE POLICY "Users can update their own onboarding"
ON public.user_onboarding FOR UPDATE
USING (auth.uid() = user_id);

-- Create user subject interests table
CREATE TABLE public.user_subject_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  interest_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, interest_category)
);

-- Enable RLS
ALTER TABLE public.user_subject_interests ENABLE ROW LEVEL SECURITY;

-- Users can view their own interests
CREATE POLICY "Users can view their own interests"
ON public.user_subject_interests FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interests
CREATE POLICY "Users can insert their own interests"
ON public.user_subject_interests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete their own interests"
ON public.user_subject_interests FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_onboarding
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON public.user_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Pre-populate cohorts with common degrees
INSERT INTO public.cohorts (degree_name) VALUES
  ('Computer Science'),
  ('Business Administration'),
  ('Medicine / Pre-Med'),
  ('Engineering'),
  ('Data Science'),
  ('Psychology'),
  ('Biology'),
  ('Economics'),
  ('Communications'),
  ('Other');