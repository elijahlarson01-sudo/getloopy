-- Insert IE-specific subjects
INSERT INTO public.subjects (name, icon, color, description) VALUES
('Digital Experience & CRO', '📊', '#3B82F6', 'User experience optimization and conversion rate strategies'),
('Supply Chain Management', '🚚', '#10B981', 'End-to-end supply chain optimization and logistics'),
('Digital Operations', '⚙️', '#8B5CF6', 'Digital transformation of business operations'),
('Digital Marketing Analytics', '📈', '#F59E0B', 'Data-driven marketing strategies and analytics'),
('Business Intelligence', '💡', '#EC4899', 'Data visualization and business insights'),
('E-Commerce Strategy', '🛒', '#06B6D4', 'Online retail and marketplace strategies'),
('Product Management', '🎯', '#EF4444', 'Product lifecycle and development methodologies'),
('Data Science Fundamentals', '🔬', '#6366F1', 'Statistical analysis and machine learning basics')
ON CONFLICT DO NOTHING;

-- Link subjects to MDBI cohort (Masters in Digital Business & Innovation)
INSERT INTO public.cohort_subjects (cohort_id, subject_id)
SELECT c.id, s.id
FROM public.cohorts c, public.subjects s
WHERE c.degree_name = 'Masters in Digital Business & Innovation'
AND s.name IN ('Digital Experience & CRO', 'Supply Chain Management', 'Digital Operations', 'Digital Marketing Analytics', 'E-Commerce Strategy')
ON CONFLICT DO NOTHING;

-- Link subjects to Masters in Marketing
INSERT INTO public.cohort_subjects (cohort_id, subject_id)
SELECT c.id, s.id
FROM public.cohorts c, public.subjects s
WHERE c.degree_name = 'Masters in Marketing'
AND s.name IN ('Digital Marketing Analytics', 'E-Commerce Strategy', 'Digital Experience & CRO', 'Business Intelligence')
ON CONFLICT DO NOTHING;

-- Link subjects to Master's in Management
INSERT INTO public.cohort_subjects (cohort_id, subject_id)
SELECT c.id, s.id
FROM public.cohorts c, public.subjects s
WHERE c.degree_name = 'Master''s in Management'
AND s.name IN ('Supply Chain Management', 'Digital Operations', 'Product Management', 'Business Intelligence')
ON CONFLICT DO NOTHING;

-- Link subjects to Master's in Finance
INSERT INTO public.cohort_subjects (cohort_id, subject_id)
SELECT c.id, s.id
FROM public.cohorts c, public.subjects s
WHERE c.degree_name = 'Master''s in Finance'
AND s.name IN ('Business Intelligence', 'Data Science Fundamentals', 'Digital Operations')
ON CONFLICT DO NOTHING;

-- Link subjects to Big Data & Analytics
INSERT INTO public.cohort_subjects (cohort_id, subject_id)
SELECT c.id, s.id
FROM public.cohorts c, public.subjects s
WHERE c.degree_name = 'Big Data & Analytics'
AND s.name IN ('Data Science Fundamentals', 'Business Intelligence', 'Digital Marketing Analytics', 'Digital Experience & CRO')
ON CONFLICT DO NOTHING;