INSERT INTO self_assessment_categories
  (name, description)
VALUES
  ('Adaptability', 'Ability to adjust to new conditions and handle changes effectively'),
  ('Communication', 'Skill in expressing ideas clearly and listening to others'),
  ('Leadership', 'Ability to guide others and take initiative in various situations'),
  ('Teamwork', 'Capacity to collaborate effectively and support colleagues'),
  ('Work Ethic', 'Commitment to responsibility, time management, and professional conduct');

INSERT INTO self_assessment_categories
  (name, description)
VALUES
  ('Leadership', 'Ability to lead and guide teams'),
  ('Problem-solving', 'Approach to analyzing and resolving challenges'),
  ('Adaptability', 'Flexibility in changing environments'),
  ('Communication', 'Effectiveness in interpersonal interactions'),
  ('Learning Approach', 'Method of acquiring and processing new skills'),
  ('Goal-orientation', 'Ability to set and pursue objectives'),
  ('Stress Management', 'Handling pressure and challenging situations'),
  ('Feedback Reception', 'Openness to constructive criticism'),
  ('Risk Tolerance', 'Willingness to take calculated risks'),
  ('Time Management', 'Organizational skills and productivity');

-- Then, insert the mappings
INSERT INTO self_assessment_mappings
  (
  question_id,
  answer_value,
  category_id,
  points
  )
SELECT
  q.id,
  option_key::int,
  c.id,
  option_key::int
FROM
  self_assessment_questions q
CROSS JOIN (
    VALUES
    ('1', 'Leadership'),
    ('2', 'Problem-solving'),
    ('3', 'Adaptability'),
    ('4', 'Communication'),
    ('5', 'Learning Approach'),
    ('6', 'Goal-orientation'),
    ('7', 'Stress Management'),
    ('8', 'Feedback Reception'),
    ('9', 'Risk Tolerance'),
    ('10', 'Time Management')
) AS qc(question_number, category_name)
CROSS JOIN (
    VALUES
    ('1'),
    ('2'),
    ('3'),
    ('4')
) AS options(option_key)
  JOIN self_assessment_categories c ON c.name = qc.category_name
WHERE 
    q.type = 'personality' AND
  q.id = (
        SELECT id
  FROM self_assessment_questions
  WHERE type = 'personality'
  ORDER BY id 
        OFFSET (qc.question_number::int - 1) 
        LIMIT
1
    );