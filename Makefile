# Makefile - common development shortcuts

.PHONY: up down logs test lint security

up:
	docker compose up --build -d

down:
	docker compose down -v

logs:
	docker compose logs -f

# Python tests (runs inside backend container)
test-py:
	docker compose exec backend bash -c "cd /app && pytest"

# JavaScript tests (runs inside openedx container)
test-js:
	docker compose exec openedx bash -c "cd /edx/app/edx-platform && npm ci && npm run test"

lint:
	docker compose exec backend bash -c "flake8 . && pylint ."
	docker compose exec openedx bash -c "npm run lint"

security:
	docker compose exec backend bash -c "bandit -r ."
	docker compose exec openedx bash -c "npm audit"
