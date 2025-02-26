CREATE TABLE IF NOT EXISTS self_assessment_categories(
    id SERIAL PRIMARY KEY,
    name varchar(255),
    description text
);