-- Insert Digital Marketing subject
INSERT INTO subjects (id, name, description, icon, color)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Digital Marketing',
  'Master digital marketing strategies and content creation',
  'TrendingUp',
  'warning'
);

-- Insert Beginner modules for Digital Marketing
INSERT INTO modules (subject_id, title, description, difficulty_level, order_index, question_count) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Inbound vs Outbound Marketing', 'Learn the fundamental differences between inbound and outbound marketing approaches', 'beginner', 1, 8),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'What is Content Marketing', 'Understand content marketing fundamentals and why brands need it', 'beginner', 2, 8),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Digital Marketing Basics', 'Introduction to digital marketing channels and strategies', 'beginner', 3, 8);

-- Insert Intermediate modules
INSERT INTO modules (subject_id, title, description, difficulty_level, order_index, question_count) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'The Conversion Funnel', 'Master the digital conversion funnel stages from attraction to conversion', 'intermediate', 4, 9),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Content Marketing Campaigns', 'Design and execute content marketing campaigns across the funnel', 'intermediate', 5, 9),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lead Generation & Nurturing', 'Strategies for acquiring and nurturing leads through content', 'intermediate', 6, 9);

-- Insert Advanced modules
INSERT INTO modules (subject_id, title, description, difficulty_level, order_index, question_count) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Marketing Automation', 'Implement advanced marketing automation workflows and CRM integration', 'advanced', 7, 9),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Content Strategy Implementation', 'Build comprehensive content strategies with measurement and optimization', 'advanced', 8, 9),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Digital Metrics & Analytics', 'Track and optimize digital marketing performance with advanced metrics', 'advanced', 9, 9);