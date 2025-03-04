CREATE TABLE IF NOT EXISTS self_assessment_mappings (
    id SERIAL PRIMARY KEY,
    question_id int not null, 
    answer_value int,
    category_id int not null,
    points int,
    constraint fk_question foreign key (question_id) REFERENCES self_assessment_questions(id) on delete SET NULL,
    constraint fk_category foreign key (category_id) REFERENCES self_assessment_categories(id) on delete SET NULL
);

-- Create mappings between questions and categories
WITH behavioral_mappings AS (
  SELECT * FROM (
    VALUES
      -- Adaptability Category
      ('I remain calm and focused under pressure', 'Adaptability'),
      ('I am comfortable adapting to unexpected changes', 'Adaptability'),
      ('I remain positive even when facing challenges', 'Adaptability'),
      
      -- Communication Category
      ('I carefully listen to others before responding.', 'Communication'),
      ('I communicate my ideas clearly and effectively.', 'Communication'),
      ('I make an effort to understand different perspectives.', 'Communication'),
      
      -- Leadership Category
      ('I proactively take the lead when working on projects.', 'Leadership'),
      ('When facing a conflict, I try to resolve it diplomatically.', 'Leadership'),
      ('I can effectively multitask and handle multiple priorities.', 'Leadership'),
      
      -- Teamwork Category
      ('I prefer working in a team rather than alone.', 'Teamwork'),
      ('I encourage and support my colleagues in the workplace.', 'Teamwork'),
      ('I am open to constructive criticism and feedback.', 'Teamwork'),
      
      -- Work Ethic Category
      ('I always meet deadlines and manage my time effectively.', 'Work Ethic'),
      ('I take responsibility for my mistakes and learn from them.', 'Work Ethic'),
      ('I follow company policies and ethical guidelines strictly.', 'Work Ethic')
  ) AS t(question_text, category_name)
)
INSERT INTO self_assessment_mappings (question_id, answer_value, category_id, points)
SELECT
  q.id AS question_id,
  option_key::int AS answer_value,
  c.id AS category_id,
  option_key::int AS points
FROM
  self_assessment_questions q
JOIN 
  behavioral_mappings bm ON q.question = bm.question_text
JOIN 
  self_assessment_categories c ON c.name = bm.category_name
CROSS JOIN (
  VALUES ('1'), ('2'), ('3'), ('4')
) AS options(option_key)
WHERE
  q.type = 'behavioral';

-- Personality Assessment Mappings
INSERT INTO self_assessment_mappings (
  question_id,
  answer_value,
  category_id,
  points
)
SELECT
  id,
  option_key::int,
  (
    CASE
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%team projects%' AND type = 'personality' LIMIT 1) THEN 3  -- Leadership
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%challenging situation%' AND type = 'personality' LIMIT 1) THEN 6  -- Problem-solving
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%unexpected changes%' AND type = 'personality' LIMIT 1) THEN 1  -- Adaptability
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%communication style%' AND type = 'personality' LIMIT 1) THEN 2  -- Communication
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%learning a new skill%' AND type = 'personality' LIMIT 1) THEN 7  -- Learning Approach
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%personal and professional goals%' AND type = 'personality' LIMIT 1) THEN 8  -- Goal-orientation
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%high-stress situation%' AND type = 'personality' LIMIT 1) THEN 9  -- Stress Management
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%receive feedback%' AND type = 'personality' LIMIT 1) THEN 10  -- Feedback Reception
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%approach to risk-taking%' AND type = 'personality' LIMIT 1) THEN 11  -- Risk Tolerance
      WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%manage your time%' AND type = 'personality' LIMIT 1) THEN 12  -- Time Management
    END
  ),
  (
    CASE
      WHEN option_key = '4' THEN 4
      WHEN option_key = '3' THEN 3
      WHEN option_key = '2' THEN 2
      WHEN option_key = '1' THEN 1
    END
  )
FROM (
  SELECT 
    id, 
    unnest(array['1', '2', '3', '4']) AS option_key
  FROM self_assessment_questions
  WHERE type = 'personality'
) AS options;


-- For cognitive questions, add explicit column list to match the values
INSERT INTO self_assessment_mappings
  (question_id, answer_value, category_id, points)  -- Added this column list
SELECT 
  q.id, 
  CASE
    WHEN q.question LIKE 'If 2x + 3 = 9%' THEN 2 
    WHEN q.question LIKE 'How many 3-letter%' THEN 2 
    WHEN q.question LIKE 'Which number comes next%' THEN 1 
    WHEN q.question LIKE 'In a team of 10 people%' THEN 2 
    WHEN q.question LIKE 'If the radius of a circle%' THEN 2 
    WHEN q.question LIKE 'A train travels%' THEN 2 
    WHEN q.question LIKE 'If 30%% of a number%' THEN 2 
    WHEN q.question LIKE 'Which of the following is a valid%' THEN 4 
    WHEN q.question LIKE 'A piece of paper%' THEN 3 
    WHEN q.question LIKE 'If a dice is rolled%' THEN 1 
    ELSE 1 
  END as answer_value,
  (SELECT id FROM self_assessment_categories WHERE name = 
    CASE
      WHEN q.question LIKE 'If 2x + 3 = 9%' THEN 'Numerical Reasoning'
      WHEN q.question LIKE 'How many 3-letter%' THEN 'Logical Reasoning'
      WHEN q.question LIKE 'Which number comes next%' THEN 'Pattern Recognition'
      WHEN q.question LIKE 'In a team of 10 people%' THEN 'Numerical Reasoning'
      WHEN q.question LIKE 'If the radius of a circle%' THEN 'Numerical Reasoning'
      WHEN q.question LIKE 'A train travels%' THEN 'Numerical Reasoning'
      WHEN q.question LIKE 'If 30%% of a number%' THEN 'Numerical Reasoning'
      WHEN q.question LIKE 'Which of the following is a valid%' THEN 'Logical Reasoning'
      WHEN q.question LIKE 'A piece of paper%' THEN 'Spatial Reasoning'
      WHEN q.question LIKE 'If a dice is rolled%' THEN 'Numerical Reasoning'
      ELSE 'Logical Reasoning'
    END
  ) as category_id,
  CASE 
    WHEN q.question LIKE 'If 2x + 3 = 9%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'How many 3-letter%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'Which number comes next%' AND 1 = 1 THEN 4
    WHEN q.question LIKE 'In a team of 10 people%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'If the radius of a circle%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'A train travels%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'If 30%% of a number%' AND 2 = 2 THEN 4
    WHEN q.question LIKE 'Which of the following is a valid%' AND 4 = 4 THEN 4
    WHEN q.question LIKE 'A piece of paper%' AND 3 = 3 THEN 4
    WHEN q.question LIKE 'If a dice is rolled%' AND 1 = 1 THEN 4
    ELSE 0
  END as points
FROM 
  self_assessment_questions q
WHERE 
  q.type = 'cognitive';