# CLAUDE.md — Prodigee Development Context

## What is this project?

Prodigee is an AI-powered adaptive learning platform for K-12 students, built as cloud-native containerized microservices on GCP. It's the unified codebase for Elemental Genius LLC.

## Architecture

5 FastAPI microservices behind an API gateway, all containerized for Cloud Run:

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| Gateway | 8080 | **Implemented** | Reverse proxy (httpx), rate limiting (slowapi), aggregated health |
| Auth | 8081 | **Implemented** | Parent/child JWT auth, COPPA-compliant, bcrypt, token blacklist |
| Learning Engine | 8082 | **Implemented** | Heggerty curriculum (35 weeks, 8 skills), voice processing, AI recommendations |
| Analytics | 8083 | **Implemented** | Read-only aggregation of progress data, parent dashboards, system metrics |
| AR/VR | 8084 | **Stub only** | Architecturally parked — not launch priority |

## Key Patterns

- **Config**: `pydantic-settings` with service-specific env prefix (`AUTH_`, `LEARNING_`, etc.)
- **Auth**: Shared JWT secret (HS256), parent tokens (24h), child tokens (4h), blacklist in Firestore `token_blacklist` collection
- **Firestore**: Async client via `google-cloud-firestore`, auto-detects `FIRESTORE_EMULATOR_HOST`
- **GCP APIs**: Graceful fallback — return simulated responses when Speech/TTS/Vertex unavailable locally
- **Each service is self-contained**: Own schemas.py, dependencies.py, routes/ — no cross-service imports
- **shared/models/**: Canonical Firestore document schemas (documentation only, not imported by services)
- **Docker**: `sg docker -c "docker compose ..."` (moose user not in docker group)

## Running Locally

```bash
sg docker -c "docker compose up --build"
# Or build a single service:
sg docker -c "docker compose build auth"
```

## Firestore Collections

| Collection | Written by | Read by |
|---|---|---|
| `parents` | Auth | Analytics |
| `children` | Auth | Learning Engine, Analytics |
| `token_blacklist` | Auth | All services (JWT validation) |
| `phonemic_progress` | Learning Engine | Analytics |
| `learning_sessions` | Learning Engine | Analytics |
| `voice_interactions` | Learning Engine | Analytics |

## Endpoint Summary

**Auth (8081)**: POST `/parent/register`, `/parent/login`, `/parent/add_child`, `/child/login`, `/logout`, `/token/validate` + GET `/health`

**Learning Engine (8082)**: GET `/curriculum/week/{n}`, `/subjects`, `/content`, `/child/dashboard`, `/child/activity/{type}` + POST `/child/activity/{type}/complete`, `/voice/process`, `/voice/synthesize`, `/ai/recommendation` + GET `/health`

**Analytics (8083)**: GET `/child/{id}/progress`, `/child/{id}/phonemic-progress`, `/child/{id}/sessions`, `/child/{id}/assessments`, `/parent/{id}/dashboard`, `/classroom/{id}/report`, `/system/metrics` + GET `/health`

**Gateway (8080)**: Proxies `/api/auth/*`, `/api/learning/*`, `/api/analytics/*`, `/api/ar-vr/*` + GET `/health`, `/services/health`, `/`

## GCP

- Project: `prodigee-488119`, Region: `us-east1`, Firestore: `nam5`
- CI/CD: `cloudbuild.yaml` — push to main triggers build + deploy to Cloud Run
- Artifact Registry: `us-east1-docker.pkg.dev/prodigee-488119/prodigee/`

## Critical Rules

1. **Cloud-native on GCP** — never suggest self-hosting
2. **Use GCP APIs** for AI, speech, translation, vision — not in-house
3. **Containerized from day one** — no monolith patterns
4. **Ubuntu only** — no OpenSUSE references
5. **AR/VR is parked** — don't prioritize for launch
6. **COPPA compliance** — children can't self-register, no PII, text transcripts only, age-based session limits
7. **Domains**: getprodigee.com and getprodigee.net (owned, not yet configured)
