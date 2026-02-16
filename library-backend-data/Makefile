.PHONY: help install dev test clean docker-up docker-down migrate import-data

help:
	@echo "Available commands:"
	@echo "  install      Install dependencies"
	@echo "  dev          Run development server"
	@echo "  test         Run tests"
	@echo "  clean        Clean temporary files"
	@echo "  docker-up    Start Docker containers"
	@echo "  docker-down  Stop Docker containers"
	@echo "  migrate      Run database migrations"
	@echo "  import-data  Import sample data"

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --port 8000

test:
	pytest tests/ -v

test-cov:
	pytest tests/ --cov=app --cov-report=html

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage
	rm -f test.db

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f app

migrate:
	alembic upgrade head

migrate-create:
	alembic revision --autogenerate -m "$(message)"

import-data:
	python scripts/import_cli.py gutenberg data/gutenberg
	python scripts/import_cli.py bible data/bible.xml
	python scripts/import_cli.py founding data/founding_documents

format:
	black app/ tests/
	flake8 app/ tests/

lint:
	mypy app/
	flake8 app/ tests/