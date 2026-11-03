.DEFAULT_GOAL := help
.PHONY: help env up up-build up-prod down clean logs ps psql shell-api shell-web \
        migrate migrate-add migrate-reset test test-unit test-integration \
        test-backend test-frontend lint lint-backend lint-frontend format build \
        build-deploy

COMPOSE := docker compose
APP_PROJECT := src/Zenvokra.Application
API_PROJECT := src/Zenvokra.Api

help: ## Show available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

env: ## Create .env from .env.example if missing
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")

up: env ## Start the full stack (postgres, api, web)
	$(COMPOSE) up -d
	@echo ""
	@echo "  web      http://localhost:$${WEB_PORT:-5173}"
	@echo "  api      http://localhost:$${API_PORT:-8080}"

up-build: env ## Rebuild images and start the stack
	$(COMPOSE) up -d --build

down: ## Stop the stack, keeping volumes
	$(COMPOSE) down

clean: ## Stop the stack and delete volumes (destroys local data)
	$(COMPOSE) down -v

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

ps: ## Show container status
	$(COMPOSE) ps

psql: ## Open a psql shell on the database
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-zenvokra} -d $${POSTGRES_DB:-zenvokra_hr}

shell-api: ## Open a shell in the api container
	$(COMPOSE) exec api bash

shell-web: ## Open a shell in the web container
	$(COMPOSE) exec web sh

migrate: ## Apply pending EF Core migrations
	$(COMPOSE) exec api dotnet ef database update -p $(APP_PROJECT) -s $(API_PROJECT)

migrate-add: ## Create a migration: make migrate-add NAME=AddEmployees
	@test -n "$(NAME)" || (echo "NAME is required, e.g. make migrate-add NAME=AddEmployees" && exit 1)
	$(COMPOSE) exec api dotnet ef migrations add $(NAME) -p $(APP_PROJECT) -s $(API_PROJECT)

migrate-reset: ## Delete and regenerate the initial migration from the current model
	$(COMPOSE) exec api sh -c 'rm -rf $(APP_PROJECT)/Migrations'
	$(COMPOSE) exec api dotnet ef migrations add InitialCreate -p $(APP_PROJECT) -s $(API_PROJECT)

test: test-unit test-frontend ## Run the tests that need no extra services

test-unit: ## Run backend unit tests
	$(COMPOSE) exec api dotnet test tests/Zenvokra.UnitTests

test-integration: ## Run backend integration tests (starts a PostgreSQL container)
	$(COMPOSE) exec api dotnet test tests/Zenvokra.IntegrationTests

test-backend: test-unit test-integration ## Run all backend tests

test-frontend: ## Run frontend tests
	$(COMPOSE) exec web npm run test:run

lint: lint-backend lint-frontend ## Lint both projects

lint-backend: ## Verify C# formatting
	$(COMPOSE) exec api dotnet format --verify-no-changes

lint-frontend: ## Run ESLint and the TypeScript compiler
	$(COMPOSE) exec web npm run lint
	$(COMPOSE) exec web npm run typecheck

format: ## Auto-format both projects
	$(COMPOSE) exec api dotnet format
	$(COMPOSE) exec web npm run format

build: ## Build the production images (ignores the development override)
	$(COMPOSE) -f docker-compose.yml build

up-prod: env ## Run the production-like stack instead of the development one
	$(COMPOSE) -f docker-compose.yml up -d --build

build-deploy: ## Build the Render image (SPA + API, no Compose Postgres)
	docker build -t zenvokra-hr:deploy .
