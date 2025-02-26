CREATE TABLE IF NOT EXISTS user_assessment_scores(
    id SERIAL PRIMARY KEY,
    user_id int,
    session_id int, 
    category_id int,
    score int default 0,
    constraint fk_user_score foreign key (user_id) REFERENCES users(id) on delete SET NULL,
    constraint fk_session_score foreign key (session_id) REFERENCES user_assessment_session(id) on delete SET NULL,
    constraint fk_category_score foreign key (category_id) REFERENCES self_assessment_categories(id) on delete SET NULL
);