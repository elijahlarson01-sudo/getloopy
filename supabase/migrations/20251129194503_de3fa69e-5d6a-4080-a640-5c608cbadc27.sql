-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view onboarding in their cohort" ON public.user_onboarding;

-- Create a security definer function to get user's cohort_id
CREATE OR REPLACE FUNCTION public.get_user_cohort_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cohort_id FROM public.user_onboarding WHERE user_id = _user_id LIMIT 1
$$;

-- Create new policy using the function
CREATE POLICY "Users can view onboarding in their cohort"
ON public.user_onboarding
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (cohort_id = public.get_user_cohort_id(auth.uid()))
);