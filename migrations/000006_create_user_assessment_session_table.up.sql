CREATE TABLE IF NOT EXISTS user_assessment_sessions(
    id SERIAL PRIMARY KEY,
    user_id int not null,
    assessment_type varchar(50) not null,
    started_at timestamp DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp null
);