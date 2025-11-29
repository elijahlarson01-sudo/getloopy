-- Allow users to view profiles of people in their cohort
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in their cohort" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  id IN (
    SELECT uo.user_id 
    FROM user_onboarding uo 
    WHERE uo.cohort_id = (
      SELECT cohort_id 
      FROM user_onboarding 
      WHERE user_id = auth.uid()
    )
  )
);

-- Allow users to view progress of people in their cohort
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;

CREATE POLICY "Users can view progress in their cohort" 
ON public.user_progress 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  user_id IN (
    SELECT uo.user_id 
    FROM user_onboarding uo 
    WHERE uo.cohort_id = (
      SELECT cohort_id 
      FROM user_onboarding 
      WHERE user_id = auth.uid()
    )
  )
);