CREATE TABLE IF NOT EXISTS user_answers(
     id SERIAL PRIMARY KEY,
     user_id int,
     session_id int, 
     question_id int,
     answer_value jsonb not null,
     constraint fk_user_answer foreign key (user_id) REFERENCES users(id) on delete SET NULL,
     constraint fk_session_answer foreign key (session_id) REFERENCES user_assessment_sessions(id) on delete SET NULL,
     constraint fk_question_answer foreign key (question_id) REFERENCES self_assessment_questions(id) on delete SET NULL
);