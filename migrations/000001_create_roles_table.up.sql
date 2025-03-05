CREATE TABLE IF NOT EXISTS roles(
    id SERIAL PRIMARY KEY,
    name varchar(100) NOT NULL,
    created_at timestamp default now()
);

INSERT INTO roles ("name", created_at) VALUES
('admin', now()),
('candidate', now());
