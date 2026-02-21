# Development Guide

Local development setup for the Prodigee platform.

---

## Prerequisites

- **Docker** + Docker Compose
- **Python 3.12+** (for running services outside Docker)
- **Node.js 20+** (for client apps)
- **gcloud CLI** (authenticated to `prodigee-488119`)
- **Git** with SSH access to GitHub

---

## Local Development with Docker Compose

The fastest way to get all services running:

```bash
docker compose up --build
```

This starts:
- All 5 microservices (gateway, auth, learning-engine, analytics, ar-vr)
- Firestore emulator for local data persistence

### Service URLs

| Service | URL | Docs |
|---------|-----|------|
| Gateway | http://localhost:8080 | http://localhost:8080/docs |
| Auth | http://localhost:8081 | http://localhost:8081/docs |
| Learning Engine | http://localhost:8082 | http://localhost:8082/docs |
| Analytics | http://localhost:8083 | http://localhost:8083/docs |
| AR/VR | http://localhost:8084 | http://localhost:8084/docs |
| Firestore Emulator | http://localhost:8086 | — |

Each service exposes auto-generated API docs at `/docs` (Swagger UI) in development mode.

### Health Checks

```bash
curl http://localhost:8080/health   # gateway
curl http://localhost:8081/health   # auth
curl http://localhost:8082/health   # learning-engine
curl http://localhost:8083/health   # analytics
curl http://localhost:8084/health   # ar-vr
```

---

## Running a Single Service

To work on one service without Docker:

```bash
cd services/auth

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export AUTH_ENVIRONMENT=development
export AUTH_JWT_SECRET=dev-secret
export FIRESTORE_EMULATOR_HOST=localhost:8086

# Run with auto-reload
uvicorn src.main:app --host 0.0.0.0 --port 8081 --reload
```

---

## Environment Variables

Each service uses a prefix for its environment variables to avoid conflicts:

| Service | Prefix | Example |
|---------|--------|---------|
| Gateway | `GATEWAY_` | `GATEWAY_AUTH_SERVICE_URL` |
| Auth | `AUTH_` | `AUTH_JWT_SECRET` |
| Learning Engine | `LEARNING_` | `LEARNING_VERTEX_AI_MODEL` |
| Analytics | `ANALYTICS_` | `ANALYTICS_ENVIRONMENT` |
| AR/VR | `ARVR_` | `ARVR_ENVIRONMENT` |

Common variables (no prefix):
- `GOOGLE_CLOUD_PROJECT` — GCP project ID (`prodigee-488119`)
- `FIRESTORE_EMULATOR_HOST` — Firestore emulator address (local dev only)

---

## GCP Authentication

### For local development against real GCP services:

```bash
# Application Default Credentials (used by Python GCP libraries)
gcloud auth application-default login

# gcloud CLI auth (for deployments)
gcloud auth login
gcloud config set project prodigee-488119
gcloud config set run/region us-east1
```

### For local development with emulators:

Set `FIRESTORE_EMULATOR_HOST=localhost:8086` — the Python GCP libraries will automatically use the emulator instead of production Firestore.

---

## Project Structure per Service

```
services/<service-name>/
├── Dockerfile           # Cloud Run container definition
├── requirements.txt     # Python dependencies
├── src/
│   ├── __init__.py
│   ├── main.py          # FastAPI app entry point
│   └── config.py        # Service configuration (pydantic-settings)
└── tests/               # Service-specific tests
```

---

## Shared Library

Common models and utilities live in `shared/`:

```
shared/
├── models/
│   ├── users.py         # Parent, Child (Firestore schemas)
│   └── learning.py      # PhonemicProgress, LearningSession, Assessment
├── utils/               # Common utilities
└── config/              # Shared configuration
```

These are Pydantic models that define the canonical Firestore document shapes used across all services.

---

## Testing

```bash
# Run tests for a specific service
cd services/auth
pytest tests/

# Run all tests (from repo root)
pytest services/*/tests/
```

---

## Building Docker Images

```bash
# Build a single service
docker build -t prodigee-auth:local services/auth/

# Build all services
docker compose build
```

---

## Deploying to Cloud Run

### Manual deploy (single service):

```bash
SERVICE=auth
IMAGE=us-east1-docker.pkg.dev/prodigee-488119/prodigee/${SERVICE}

docker build -t ${IMAGE}:latest services/${SERVICE}/
docker push ${IMAGE}:latest
gcloud run deploy prodigee-${SERVICE} \
  --image=${IMAGE}:latest \
  --region=us-east1 \
  --platform=managed
```

### Automated deploy (all services):

Push to `main` triggers Cloud Build via `cloudbuild.yaml`, which builds all services in parallel and deploys to Cloud Run.

---

## Key Conventions

1. **FastAPI** for all new services — not Flask
2. **Pydantic** models for all data validation and Firestore schemas
3. **pydantic-settings** for configuration with environment variable prefixes
4. **Firestore** for data persistence — not PostgreSQL
5. **GCP APIs** for AI, speech, translation, vision — no self-hosted models
6. **Cloud Run** for deployment — no VMs, no Kubernetes (unless scaling demands it)
7. **Health checks** at `GET /health` on every service
8. **Auto-docs** at `GET /docs` in development mode only
