# Makefile - common development shortcuts

.PHONY: up down logs test-py test-js lint security

up:
	docker compose up --build -d

down:
	docker compose down -v

logs:
	docker compose logs -f

# Python tests (runs inside learnnov-cloud container)
test-py:
	docker compose exec learnnov-cloud bash -c "cd /app && pytest"

# JavaScript tests (runs inside learnnov-lms container)
test-js:
	docker compose exec learnnov-lms bash -c "cd /edx/app/edx-platform && npm ci && npm run test"

lint:
	docker compose exec learnnov-cloud bash -c "flake8 . && pylint ."
	docker compose exec learnnov-lms bash -c "npm run lint"

security:
	docker compose exec learnnov-cloud bash -c "bandit -r ."
	docker compose exec learnnov-lms bash -c "npm audit"
