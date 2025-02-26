-- name: GetRole :one
SELECT id, name, created_at
FROM roles
WHERE id = $1 LIMIT 1;

-- name: CreateRole :one
INSERT INTO roles (
    name, created_at
) VALUES (
    $1, NOW())
RETURNING id, name, created_at;