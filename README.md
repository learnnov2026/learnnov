# LEARNNOV PLATFORM

A **monorepo** that bundles two major components:

1. **learnnov-cloud** – a custom Django backend that provides API services and integrates with Render.com for deployment.
2. **openedx-platform-master** – the upstream Open edX LMS / Studio code‑base (Python + React) used for the learning experience.

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph FE[Frontend]
        direction TB
        React[React UI (Paragon, @edx/*)]
    end
    subgraph BE[Backend Services]
        direction TB
        Django[LearnNov Cloud (Django)]
        OpenEdX[Open edX (LMS & CMS)]
    end
    subgraph DB[Data Stores]
        direction TB
        Postgres[(PostgreSQL)]
        Redis[(Redis)]
    end
    subgraph CI[CI/CD]
        direction TB
        GitHub[GitHub Actions]
    end
    FE -->|API calls| Django
    FE -->|API calls| OpenEdX
    Django -->|ORM| Postgres
    OpenEdX -->|ORM| Postgres
    Django -->|Cache| Redis
    OpenEdX -->|Cache| Redis
    GitHub -->|Build & Test| Django
    GitHub -->|Build & Test| OpenEdX
    GitHub -->|Deploy| Render[Render.com]
```

[![CI](https://github.com/your-username/LEARNNOV-PLATFORM/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/LEARNNOV-PLATFORM/actions/workflows/ci.yml)

[![Docker Build](https://github.com/your-username/LEARNNOV-PLATFORM/actions/workflows/docker-build.yml/badge.svg)](https://github.com/your-username/LEARNNOV-PLATFORM/actions/workflows/docker-build.yml)

---

## Quick Start (local development)

```bash
# Clone the repo
git clone <repo-url>
cd "LEARNNOV PLATFORM"

# ---------- learnnov-cloud ----------
cd learnnov-cloud
python -m venv venv
source venv/bin/activate  # on Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# ---------- openedx-platform ----------
cd ../openedx-platform-master
npm ci               # install Node dependencies
npm run webpack      # build assets
python -m venv venv2
source venv2/bin/activate
pip install -r requirements/*.txt
./manage.py migrate
./manage.py runserver 0.0.0.0:8001
```

See **CONTRIBUTING.md** for the full Docker‑Compose workflow.

## Development Helpers

- Copy `.env.example` to `.env` and fill in the required values before running the services.
- Use the provided `Makefile` shortcuts for common tasks:
  ```
  make up          # Start all services via Docker Compose
  make down        # Stop and remove containers
  make logs        # Tail logs of all containers
  make test-py     # Run Python tests with coverage
  make test-js     # Run JavaScript tests with coverage
  make lint        # Run all linters (flake8, pylint, eslint, prettier)
  make security    # Run Bandit and npm audit scans
  ```

---

## Google Cloud (GKE) Deployment

Deployment to Google Kubernetes Engine is fully automated via PowerShell scripts. 
To deploy from a Windows environment:

1. **Prerequisites:** Ensure you have [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed.
2. **Billing:** Ensure your GCP project has billing enabled.
3. **Setup Infrastructure:**
   ```powershell
   .\gke-setup.ps1
   ```
4. **Prepare Secrets:**
   Generate base64 encoded secrets and update `learnnov-cloud/k8s/secrets.yaml`.
   ```powershell
   .\generate-secrets.ps1
   ```
5. **Deploy Application:**
   ```powershell
   .\deploy-gke.ps1
   ```
