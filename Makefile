# Secret Santa Application Makefile
# Development environment automation

.PHONY: help install build start stop restart logs clean test lint format health check-env

# Default target
help: ## Show this help message
	@echo "Secret Santa Application - Development Commands"
	@echo "=============================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Environment setup
check-env: ## Check if required environment files exist
	@echo "🔍 Checking environment setup..."
	@if [ ! -f .env ]; then \
		echo "⚠️  .env file not found. Creating from .env.example..."; \
		cp .env.example .env; \
		echo "✅ Created .env file. Please review and update as needed."; \
	else \
		echo "✅ .env file exists"; \
	fi

install: check-env ## Install dependencies
	@echo "📦 Installing dependencies..."
	npm install

# Development commands
build: check-env ## Build all services
	@echo "🔨 Building all services..."
	docker compose build

start: check-env ## Start development environment
	@echo "🚀 Starting development environment..."
	docker compose up -d --build

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker compose down

restart: stop start ## Restart all services

# Monitoring and debugging
logs: ## Show logs for all services
	docker compose logs -f

logs-server: ## Show server logs only
	docker compose logs -f server

logs-client: ## Show client logs only
	docker compose logs -f client

logs-db: ## Show database logs only
	docker compose logs -f postgres

health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@echo "Database:"
	@docker compose exec -T postgres pg_isready -U secret_santa_user -d secret_santa || echo "❌ Database not ready"
	@echo "Backend API:"
	@curl -f http://localhost:3000/api/health 2>/dev/null && echo "✅ Backend healthy" || echo "❌ Backend not ready"
	@echo "Frontend:"
	@curl -f http://localhost 2>/dev/null && echo "✅ Frontend healthy" || echo "❌ Frontend not ready"

# Database operations
db-migrate: ## Run database migrations
	docker compose exec server npm run db:migrate

db-reset: ## Reset database
	docker compose exec server npm run db:reset

db-studio: ## Open Prisma Studio
	docker compose exec server npm run db:studio

# Testing
test: ## Run all tests
	@echo "🧪 Running tests..."
	npm run test:server
	npm run test:client

test-server: ## Run server tests only
	npm run test:server

test-client: ## Run client tests only
	npm run test:client

# Code quality
lint: ## Run linting
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code
	npm run format

# Cleanup
clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker compose down -v
	docker system prune -f

clean-all: ## Clean up everything including images
	@echo "🧹 Deep cleaning..."
	docker compose down -v --rmi all
	docker system prune -af

# Quick commands
quick-start: ## Quick start with health checks
	@./scripts/quick-start.sh

test-docker: ## Test Docker configuration
	@./scripts/test-docker.sh
