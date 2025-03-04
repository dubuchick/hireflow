CREATE TYPE question_type as ENUM ('personality','cognitive','behavioral');

CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id SERIAL PRIMARY KEY,
    question text not null,
    type question_type not null,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- First, insert the behavioral questions
INSERT INTO self_assessment_questions
  (question, type, options)
VALUES
  ('I remain calm and focused under pressure', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('When facing a conflict, I try to resolve it diplomatically.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I proactively take the lead when working on projects.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I carefully listen to others before responding.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I am open to constructive criticism and feedback.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I always meet deadlines and manage my time effectively.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I remain positive even when facing challenges.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I am comfortable adapting to unexpected changes.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I make an effort to understand different perspectives.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I can effectively multitask and handle multiple priorities.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I take responsibility for my mistakes and learn from them.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I follow company policies and ethical guidelines strictly.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I communicate my ideas clearly and effectively.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I prefer working in a team rather than alone.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}'),
  ('I encourage and support my colleagues in the workplace.', 'behavioral', '{"1": {"text": "Strongly Disagree", "points": 1}, "2": {"text": "Disagree", "points": 2}, "3": {"text": "Neutral", "points": 3}, "4": {"text": "Agree", "points": 4}, "5": {"text": "Strongly Agree", "points": 5}}');

-- Personality Assessment Questions Seeder
INSERT INTO self_assessment_questions 
    (question, type, options)
VALUES 
(
    'How do you typically approach team projects?',
    'personality',
    '{"1": "Prefer working independently", "2": "Collaborate and support team members", "3": "Eagerly take leadership", "4": "Avoid group work when possible"}'
),
(
    'When facing a challenging situation, you most likely:',
    'personality',
    '{"1": "Feel overwhelmed and hesitate", "2": "Trust your instincts", "3": "Seek advice from others", "4": "Analyze the problem methodically"}'
),
(
    'How do you handle unexpected changes in your work environment?',
    'personality',
    '{"1": "Struggle significantly with changes", "2": "Prefer stable and predictable environments", "3": "Feel slightly uncomfortable but adjust", "4": "Adapt quickly and see it as an opportunity"}'
),
(
    'How would you describe your communication style?',
    'personality',
    '{"1": "Avoid communication when possible", "2": "Reserved and thoughtful", "3": "Empathetic and supportive", "4": "Direct and clear"}'
),
(
    'When learning a new skill, you prefer:',
    'personality',
    '{"1": "Minimal learning effort", "2": "Self-guided learning", "3": "Structured courses with clear guidelines", "4": "Hands-on practical training"}'
),
(
    'How do you approach personal and professional goals?',
    'personality',
    '{"1": "Avoid setting goals altogether", "2": "Set goals but rarely follow through", "3": "Have general objectives with flexible approach", "4": "Set clear, detailed plans and track progress"}'
),
(
    'In a high-stress situation, you typically:',
    'personality',
    '{"1": "Shut down completely", "2": "Get easily overwhelmed", "3": "Feel stressed but manage effectively", "4": "Remain calm and solution-oriented"}'
),
(
    'How do you prefer to receive feedback?',
    'personality',
    '{"1": "Avoid feedback entirely", "2": "Feel defensive but try to listen", "3": "Prefer gentle, supportive feedback", "4": "Appreciate direct, constructive criticism"}'
),
(
    'Your approach to risk-taking is:',
    'personality',
    '{"1": "Completely avoid any risk", "2": "Hesitant and risk-averse", "3": "Moderate, with careful consideration", "4": "Calculated and strategic"}'
),
(
    'How do you typically manage your time?',
    'personality',
    '{"1": "Completely unstructured", "2": "Somewhat disorganized", "3": "Generally structured with some flexibility", "4": "Highly organized with detailed scheduling"}'
);

   
 -- Insert cognitive assessment questions
INSERT INTO self_assessment_questions
  (question, type, options)
VALUES
  ('If 2x + 3 = 9, what is the value of x?', 'cognitive', '{"1": "2", "2": "3", "3": "4", "4": "5"}'),
  ('How many 3-letter arrangements can be made using the letters A, B, C, D, E (without repetition)?', 'cognitive', '{"1": "15", "2": "60", "3": "120", "4": "20"}'),
  ('Which number comes next in the sequence: 2, 5, 10, 17, 26, ?', 'cognitive', '{"1": "37", "2": "35", "3": "39", "4": "42"}'),
  ('In a team of 10 people, how many different ways can a committee of 3 people be formed?', 'cognitive', '{"1": "120", "2": "30", "3": "720", "4": "210"}'),
  ('If the radius of a circle is doubled, by what factor does the area increase?', 'cognitive', '{"1": "2", "2": "4", "3": "8", "4": "16"}'),
  ('A train travels at 60 km/h. How far will it travel in 2.5 hours?', 'cognitive', '{"1": "120 km", "2": "150 km", "3": "180 km", "4": "240 km"}'),
  ('If 30% of a number is 45, what is the number?', 'cognitive', '{"1": "135", "2": "150", "3": "155", "4": "175"}'),
  ('Which of the following is a valid logical conclusion? All cats have tails. Rex has a tail. Therefore...', 'cognitive', '{"1": "Rex is a cat", "2": "Rex might be a cat", "3": "Rex is not a cat", "4": "Insufficient information"}'),
  ('A piece of paper is folded in half 10 times. How many layers will the paper have?', 'cognitive', '{"1": "20", "2": "512", "3": "1024", "4": "100"}'),
  ('If a dice is rolled twice, what is the probability of getting a sum of 7?', 'cognitive', '{"1": "1/6", "2": "1/12", "3": "1/4", "4": "1/3"}');
