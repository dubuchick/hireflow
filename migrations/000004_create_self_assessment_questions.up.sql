CREATE TYPE question_type as ENUM ('personality','cognitive','behavioral');

CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id SERIAL PRIMARY KEY,
    question text not null,
    type question_type not null,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answer VARCHAR(255),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);