-- name: GetUser :one
SELECT id, role_id, name, email, password, created_at
FROM users
WHERE id = $1 LIMIT 1;

-- name: AssignRoleToUser :exec
UPDATE users
SET role_id = $1
WHERE id = $2;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users(
    name, 
    email,
    password,
    role_id,
    created_at
) VALUES (
    $1,
    $2,
    $3,
    $4,
    CURRENT_TIMESTAMP
) RETURNING *;