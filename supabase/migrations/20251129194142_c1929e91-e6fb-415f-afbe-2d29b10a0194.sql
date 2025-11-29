-- Drop existing SELECT policy on user_onboarding
DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;

-- Create new policy that allows viewing cohort members
CREATE POLICY "Users can view onboarding in their cohort"
ON public.user_onboarding
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (cohort_id IN (
    SELECT cohort_id FROM user_onboarding WHERE user_id = auth.uid()
  ))
);