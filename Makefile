DB_DSN="postgresql://postgres:yourpassword@localhost:5433/postgres?sslmode=disable"
MIGRATIONS_PATH=./migrations

migrate-up:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" up

migrate-down:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" down

migrate-force:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" force 1
