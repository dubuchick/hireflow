CREATE TABLE IF NOT EXISTS self_assessment_categories(
    id SERIAL PRIMARY KEY,
    name varchar(255) UNIQUE,
    description text
);

-- Ensure behavioral categories exist
INSERT INTO self_assessment_categories
  (name, description)
VALUES
  ('Adaptability', 'Ability to adjust to new conditions and handle changes effectively'),
  ('Communication', 'Skill in expressing ideas clearly and listening to others'),
  ('Leadership', 'Ability to guide others and take initiative in various situations'),
  ('Teamwork', 'Capacity to collaborate effectively and support colleagues'),
  ('Work Ethic', 'Commitment to responsibility, time management, and professional conduct')
ON CONFLICT (name) DO NOTHING;

-- Insert personality assessment categories
INSERT INTO self_assessment_categories
  (name, description)
VALUES
  ('Problem-solving', 'Approach to analyzing and resolving challenges'),
  ('Learning Approach', 'Method of acquiring and processing new skills'),
  ('Goal-orientation', 'Ability to set and pursue objectives'),
  ('Stress Management', 'Handling pressure and challenging situations'),
  ('Feedback Reception', 'Openness to constructive criticism'),
  ('Risk Tolerance', 'Willingness to take calculated risks'),
  ('Time Management', 'Organizational skills and productivity')
ON CONFLICT (name) DO UPDATE 
  SET description = EXCLUDED.description;

-- Insert category mappings for cognitive questions
-- First, ensure we have cognitive categories
INSERT INTO self_assessment_categories
  (name, description) 
VALUES
  ('Numerical Reasoning', 'Ability to understand and work with numbers effectively'),
  ('Logical Reasoning', 'Capacity to apply logical thinking to solve problems'),
  ('Spatial Reasoning', 'Ability to understand and analyze spatial relationships'),
  ('Pattern Recognition', 'Skill in identifying patterns and relationships in data');

