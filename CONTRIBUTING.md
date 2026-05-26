# CONTRIBUTING.md

## 📚 Overview

Thank you for your interest in contributing to **LEARNNOV PLATFORM**! This repository contains two major components:

1. **learnnov‑cloud** – a custom Django backend (payments, certificates, exams, etc.)
2. **openedx‑platform‑master** – the upstream Open edX LMS/Studio code‑base.

Both components share the same PostgreSQL database and Redis cache. The recommended local development workflow uses **Docker‑Compose** to spin up the whole stack with a single command.

---

## 🛠️ Prerequisites

- **Docker** (≥ 24) and **Docker Compose** (v2) installed on your machine.
- **Git** for version control.
- (Optional) **Python 3.11** if you want to run the backend without Docker.

---

## 🚀 Quick Start (Docker Compose)

```bash
# Clone the repository
git clone <repo-url>
cd "LEARNNOV PLATFORM"

# Build and start all services
docker compose up --build -d
```

The services become available at:

- **Django API (learnnov‑cloud)** – `http://localhost:8000`
- **Open edX LMS** – `http://localhost:8001`
- **PostgreSQL** – `localhost:5432` (credentials from the compose file)
- **Redis** – `localhost:6379`

### Stopping the stack

```bash
docker compose down -v   # also removes the persisted DB volume
```

---

## 🧪 Running Tests

### Python tests (pytest)

```bash
# Inside the backend container (or with a virtualenv)
docker compose exec backend bash
cd /app
pytest --cov .
```

### JavaScript tests (Jest & Karma)

```bash
docker compose exec openedx bash   # opens a shell inside the Open edX container
npm ci
npm run test      # runs Jest + Karma
npm run coverage  # generates a coverage report in `coverage/`
```

---

## 🧹 Linting & Static Analysis

- **Python** – `flake8` and `pylint` are run in CI (`ci-static-analysis.yml`).
- **JavaScript** – `eslint` is configured via `package.json`.
- **Security** – `bandit`, `semgrep`, and `npm audit` are executed in CI.

You can run them locally:

```bash
# Python
docker compose exec backend flake8 .
docker compose exec backend pylint .

# JavaScript
docker compose exec openedx npm run lint
```

---

## 📊 Code Coverage

Coverage badges are displayed in the README. To update them locally:

```bash
# Python coverage badge
pip install coverage-badge
coverage-badge -o coverage/python-coverage.svg

# JavaScript coverage badge (via jest)
npm run coverage
```

Commit the generated `*.svg` files to keep the badge current.

---

## 🔐 Security Checklist

1. Run `bandit -r .` and address all **high** severity findings.
2. Run `npm audit` and fix vulnerable packages (`npm audit fix`).
3. Ensure no secrets are committed – use the `sanitize_secrets.py` script before pushing.

---

## 📦 Docker Image Publication (optional)

If you maintain a Docker image registry (GitHub Packages, Docker Hub, etc.), the CI job `docker-build.yml` will build and push the image automatically on every release tag.

---

## 📖 Documentation

- Keep the **architecture diagram** (Mermaid) in the top of `README.md` up‑to‑date.
- Document any new API endpoints in `learnnov-cloud/apps/*/docs/` and include them in the OpenAPI spec (`openedx/docs/lms-openapi.yaml`).

---

## 🤝 How to Contribute

1. **Fork** the repository.
2. Create a **feature branch** (`git checkout -b feature/your‑idea`).
3. Make your changes, ensuring:
   - Tests pass locally (`docker compose exec … pytest && npm run test`).
   - Linting passes (`flake8`, `eslint`).
   - Security scans are clean.
4. Commit with a clear message and **push** to your fork.
5. Open a **Pull Request** against `main`.
6. The CI pipeline will run automatically; address any failures.

---

## 📬 Contact

For questions or help, open an issue or contact the maintainers via the `#learnnov` Slack channel.
