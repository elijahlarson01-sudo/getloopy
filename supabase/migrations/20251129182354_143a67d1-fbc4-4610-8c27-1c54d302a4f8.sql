-- Create universities table
CREATE TABLE public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Anyone can view universities
CREATE POLICY "Anyone can view universities"
ON public.universities FOR SELECT
USING (true);

-- Add university_id to cohorts
ALTER TABLE public.cohorts ADD COLUMN university_id uuid REFERENCES public.universities(id);

-- Create cohort_subjects junction table
CREATE TABLE public.cohort_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(cohort_id, subject_id)
);

-- Enable RLS
ALTER TABLE public.cohort_subjects ENABLE ROW LEVEL SECURITY;

-- Anyone can view cohort_subjects
CREATE POLICY "Anyone can view cohort_subjects"
ON public.cohort_subjects FOR SELECT
USING (true);

-- Insert universities
INSERT INTO public.universities (name) VALUES
  ('IE Business School'),
  ('Harvard Business School'),
  ('INSEAD'),
  ('London Business School'),
  ('Stanford Graduate School of Business');

-- Get IE Business School ID and insert cohorts
WITH ie AS (SELECT id FROM public.universities WHERE name = 'IE Business School')
INSERT INTO public.cohorts (degree_name, university_id)
SELECT degree_name, ie.id FROM ie,
(VALUES 
  ('Masters in Marketing'),
  ('Masters in Digital Business & Innovation'),
  ('Master''s in Management'),
  ('Master''s in Finance'),
  ('Big Data & Analytics')
) AS degrees(degree_name)
ON CONFLICT DO NOTHING;