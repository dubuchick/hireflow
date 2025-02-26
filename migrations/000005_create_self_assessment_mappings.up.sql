CREATE TABLE IF NOT EXISTS self_assessment_mappings (
    id SERIAL PRIMARY KEY,
    question_id int not null, 
    answer_value int,
    category_id int not null,
    points int,
    constraint fk_question foreign key (question_id) REFERENCES self_assessment_questions(id) on delete SET NULL,
    constraint fk_category foreign key (category_id) REFERENCES self_assessment_categories(id) on delete SET NULL
);