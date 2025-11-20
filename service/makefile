# Simple FastAPI Makefile

.PHONY: help run dev install migrate-init migrate-gen migrate-up

# Default target
help:
	@echo "Available commands:"
	@echo "  run          - Run the FastAPI app"
	@echo "  dev          - Run in development mode with reload"
	@echo "  install      - Install dependencies"
	@echo "  migrate-init - Initialize Aerich migrations (run once)"
	@echo "  migrate-gen  - Generate migration for model changes"
	@echo "  migrate-up   - Apply migrations to database"

# Run the application
run:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run in development mode with auto-reload
dev:
	poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Install dependencies
install:
	poetry install

# Initialize Aerich migrations (run once)
migrate-init:
	poetry run aerich init -t app.config.TORTOISE_ORM

migrate-init-db:
	poetry run aerich init-db

# Generate migration for model changes
migrate-gen:
	poetry run aerich migrate

# Apply migrations to database
migrate-up:
	poetry run aerich upgrade