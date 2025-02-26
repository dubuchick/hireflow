CREATE TABLE IF NOT EXISTS roles(
    id SERIAL PRIMARY KEY,
    name varchar(100) NOT NULL,
    created timestamp default now()
);

CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    role_id integer null,
    name varchar(100) NOT NULL,
    email varchar(100) NOT NULL,
    password varchar(100) NOT NULL,
    created timestamp default now(),
    constraint fk_role foreign key (role_id) REFERENCES roles(id) on delete SET NULL
);