# Services

Prodigee microservices — each runs as an independent Cloud Run container.

## Overview

| Service | Port | Description |
|---------|------|-------------|
| [gateway](gateway/) | 8080 | API Gateway — routes client requests to internal services, handles rate limiting and auth token validation |
| [auth](auth/) | 8081 | Authentication — parent/child registration, login, JWT tokens, COPPA-compliant child sessions |
| [learning-engine](learning-engine/) | 8082 | Learning Engine — adaptive curriculum delivery, Vertex AI recommendations, Cloud Speech-to-Text for pronunciation, Cloud Translation for multilanguage |
| [analytics](analytics/) | 8083 | Analytics — student progress tracking, parent dashboards, teacher/admin reporting, assessment milestones |
| [ar-vr](ar-vr/) | 8084 | AR/VR — augmented/virtual reality interactive experiences (architecturally parked for post-launch) |

## Service Communication

- **Client → Gateway**: All client traffic enters through the gateway on port 8080
- **Gateway → Services**: Gateway proxies to internal services via HTTP
- **Service → Firestore**: Each service reads/writes to shared Firestore collections
- **Service → GCP APIs**: Services call GCP APIs directly (Vertex AI, Speech, Translation, Vision)

## Adding a New Service

1. Create `services/<name>/` with `Dockerfile`, `requirements.txt`, `src/main.py`, `src/config.py`
2. Add to `docker-compose.yml` for local dev
3. Add build + deploy steps to `cloudbuild.yaml`
4. Use pydantic-settings with a unique `env_prefix`
5. Include a `GET /health` endpoint

## Tech Stack (all services)

- **Framework**: FastAPI + Uvicorn
- **Config**: pydantic-settings (env var driven)
- **Data**: Google Cloud Firestore
- **Container**: python:3.12-slim base image
- **Deployment**: Cloud Run (us-east1)
