-- Update subject icons to use Lucide icon names consistently
UPDATE subjects SET icon = 'Lightbulb' WHERE name = 'Business Intelligence';
UPDATE subjects SET icon = 'FlaskConical' WHERE name = 'Data Science Fundamentals';
UPDATE subjects SET icon = 'MousePointerClick' WHERE name = 'Digital Experience & CRO';
UPDATE subjects SET icon = 'Megaphone' WHERE name = 'Digital Marketing Analytics';
UPDATE subjects SET icon = 'Cog' WHERE name = 'Digital Operations';
UPDATE subjects SET icon = 'ShoppingCart' WHERE name = 'E-Commerce Strategy';
UPDATE subjects SET icon = 'Target' WHERE name = 'Product Management';
UPDATE subjects SET icon = 'Truck' WHERE name = 'Supply Chain Management';

-- Also make existing icons more fun
UPDATE subjects SET icon = 'Brush' WHERE name = 'Art & Design';
UPDATE subjects SET icon = 'Dna' WHERE name = 'Biology';
UPDATE subjects SET icon = 'BookMarked' WHERE name = 'History';
UPDATE subjects SET icon = 'Pi' WHERE name = 'Mathematics';
UPDATE subjects SET icon = 'Zap' WHERE name = 'Physics';
UPDATE subjects SET icon = 'Languages' WHERE name = 'Spanish';