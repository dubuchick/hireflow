DB_DSN="postgresql://postgres:H34XeEpky1JxLd4Z@limpidly-thriving-peccary.data-1.use1.tembo.io:5432/postgres"
MIGRATIONS_PATH=./migrations

migrate-up:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" up

migrate-down:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" down

migrate-force:
	migrate -database "$(DB_DSN)" -path "$(MIGRATIONS_PATH)" force 1
