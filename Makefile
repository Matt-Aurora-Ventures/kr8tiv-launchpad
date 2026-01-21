.PHONY: help install dev build test lint clean docker-up docker-down docker-logs migrate seed

# Default target
help:
	@echo "KR8TIV Launchpad - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Start development servers"
	@echo "  make build      - Build all packages"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Run linters"
	@echo ""
	@echo "Database:"
	@echo "  make migrate    - Run database migrations"
	@echo "  make seed       - Seed the database"
	@echo "  make db-reset   - Reset database (WARNING: destroys data)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up  - Start all containers"
	@echo "  make docker-dev - Start development containers"
	@echo "  make docker-down - Stop all containers"
	@echo "  make docker-logs - View container logs"
	@echo "  make docker-build - Build Docker images"
	@echo ""
	@echo "Anchor:"
	@echo "  make anchor-build - Build Anchor program"
	@echo "  make anchor-test  - Test Anchor program"
	@echo "  make anchor-deploy - Deploy Anchor program"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make typecheck  - Run TypeScript type checking"

# Development
install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

typecheck:
	cd apps/api && npx tsc --noEmit
	cd apps/web && npx tsc --noEmit

# Database
migrate:
	cd apps/api && npx prisma migrate deploy

seed:
	cd apps/api && npx prisma db seed

db-reset:
	cd apps/api && npx prisma migrate reset --force

db-studio:
	cd apps/api && npx prisma studio

# Docker
docker-up:
	docker compose up -d

docker-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-build:
	docker compose build

docker-prod:
	docker compose --profile production up -d

docker-tools:
	docker compose --profile tools up -d

# Anchor
anchor-build:
	npm run anchor:build

anchor-test:
	npm run anchor:test

anchor-deploy:
	npm run anchor:deploy

# Load Testing
loadtest:
	npm run loadtest:k6

loadtest-stress:
	npm run loadtest:k6:stress

# Cleanup
clean:
	rm -rf node_modules
	rm -rf apps/api/node_modules apps/api/dist
	rm -rf apps/web/node_modules apps/web/.next apps/web/out
	rm -rf packages/shared/node_modules packages/shared/dist
	rm -rf .turbo

# Production
prod-build:
	docker compose build api web

prod-deploy:
	docker compose --profile production up -d
	docker compose exec api npx prisma migrate deploy
