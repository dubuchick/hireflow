CREATE TABLE IF NOT EXISTS self_assessment_categories(
    id SERIAL PRIMARY KEY,
    name varchar(255),
    description text
);

CREATE TYPE question_type as ENUM ('personality','cognitive','behavioral');

CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id SERIAL PRIMARY KEY,
    question text not null,
    type question_type not null,
    options JSONB NOT NULL DEFAULT '{}'::jsonb,
    correct_answer VARCHAR(255) null,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS self_assessment_mappings (
    id SERIAL PRIMARY KEY,
    question_id int not null, 
    answer_value int,
    category_id int not null,
    points int,
    constraint fk_question foreign key (question_id) REFERENCES self_assessment_questions(id) on delete SET NULL,
    constraint fk_category foreign key (category_id) REFERENCES self_assessment_categories(id) on delete SET NULL
);

CREATE TABLE IF NOT EXISTS user_assessment_sessions(
    id SERIAL PRIMARY KEY,
    user_id int not null,
    assessment_type varchar(50) not null,
    started_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp null
);

CREATE TABLE IF NOT EXISTS user_answers(
     id SERIAL PRIMARY KEY,
     user_id int,
     session_id int, 
     question_id int,
     answer_value JSONB not null,
     constraint fk_user_answer foreign key (user_id) REFERENCES users(id) on delete SET NULL,
     constraint fk_session_answer foreign key (session_id) REFERENCES user_assessment_session(id) on delete SET NULL,
     constraint fk_question_answer foreign key (question_id) REFERENCES self_assessment_questions(id) on delete SET NULL
);

CREATE TABLE IF NOT EXISTS user_assessment_scores(
    id SERIAL PRIMARY KEY,
    user_id int,
    session_id int, 
    category_id int,
    score int,
    constraint fk_user_score foreign key (user_id) REFERENCES users(id) on delete SET NULL,
    constraint fk_session_score foreign key (session_id) REFERENCES user_assessment_session(id) on delete SET NULL,
    constraint fk_category_score foreign key (category_id) REFERENCES self_assessment_categories(id) on delete SET NULL
);