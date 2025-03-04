CREATE TYPE question_type as ENUM ('personality','cognitive','behavioral');

CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id SERIAL PRIMARY KEY,
    question text not null,
    type question_type not null,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Personality Assessment Questions Seeder
INSERT INTO self_assessment_questions (
    question, 
    type, 
    options, 
    correct_answer
) VALUES 
(
    'How do you typically approach team projects?',
    'personality',
    '{
        "1": "Prefer working independently",
        "2": "Collaborate and support team members",
        "3": "Eagerly take leadership",
        "4": "Avoid group work when possible"
    }',
    NULL
),
(
    'When facing a challenging situation, you most likely:',
    'personality',
    '{
        "1": "Feel overwhelmed and hesitate",
        "2": "Trust your instincts",
        "3": "Seek advice from others",
        "4": "Analyze the problem methodically"
    }',
    NULL
),
(
    'How do you handle unexpected changes in your work environment?',
    'personality',
    '{
        "1": "Struggle significantly with changes",
        "2": "Prefer stable and predictable environments",
        "3": "Feel slightly uncomfortable but adjust",
        "4": "Adapt quickly and see it as an opportunity"
    }',
    NULL
),
(
    'How would you describe your communication style?',
    'personality',
    '{
        "1": "Avoid communication when possible",
        "2": "Reserved and thoughtful",
        "3": "Empathetic and supportive",
        "4": "Direct and clear"
    }',
    NULL
),
(
    'When learning a new skill, you prefer:',
    'personality',
    '{
        "1": "Minimal learning effort",
        "2": "Self-guided learning",
        "3": "Structured courses with clear guidelines",
        "4": "Hands-on practical training"
    }',
    NULL
),
(
    'How do you approach personal and professional goals?',
    'personality',
    '{
        "1": "Avoid setting goals altogether",
        "2": "Set goals but rarely follow through",
        "3": "Have general objectives with flexible approach",
        "4": "Set clear, detailed plans and track progress"
    }',
    NULL
),
(
    'In a high-stress situation, you typically:',
    'personality',
    '{
        "1": "Shut down completely",
        "2": "Get easily overwhelmed",
        "3": "Feel stressed but manage effectively",
        "4": "Remain calm and solution-oriented"
    }',
    NULL
),
(
    'How do you prefer to receive feedback?',
    'personality',
    '{
        "1": "Avoid feedback entirely",
        "2": "Feel defensive but try to listen",
        "3": "Prefer gentle, supportive feedback",
        "4": "Appreciate direct, constructive criticism"
    }',
    NULL
),
(
    'Your approach to risk-taking is:',
    'personality',
    '{
        "1": "Completely avoid any risk",
        "2": "Hesitant and risk-averse",
        "3": "Moderate, with careful consideration",
        "4": "Calculated and strategic"
    }',
    NULL
),
(
    'How do you typically manage your time?',
    'personality',
    '{
        "1": "Completely unstructured",
        "2": "Somewhat disorganized",
        "3": "Generally structured with some flexibility",
        "4": "Highly organized with detailed scheduling"
    }',
    NULL
);

-- Personality Assessment Mappings
INSERT INTO self_assessment_mappings (
    question_id, 
    answer_value, 
    points, 
    category_id
) 
SELECT 
    id, 
    option_key::int, 
    option_key::int, 
    (
        CASE 
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%team projects%') THEN 11  -- Leadership
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%challenging situation%') THEN 12  -- Problem-solving
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%unexpected changes%') THEN 13  -- Adaptability
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%communication style%') THEN 14  -- Communication
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%learning a new skill%') THEN 15  -- Learning Approach
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%personal and professional goals%') THEN 16  -- Goal-orientation
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%high-stress situation%') THEN 17  -- Stress Management
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%receive feedback%') THEN 18  -- Feedback Reception
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%approach to risk-taking%') THEN 19  -- Risk Tolerance
            WHEN id = (SELECT id FROM self_assessment_questions WHERE question LIKE '%manage your time%') THEN 20  -- Time Management
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