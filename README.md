# Prodigee

**Elemental Genius Unified Learning Platform**

An AI-powered adaptive learning platform for children (K-12) with emphasis on early learners and special needs education. Built as cloud-native containerized microservices on Google Cloud Platform.

**Owner:** Elemental Genius LLC
**Status:** Active development — microservices + web client built, pre-deployment

---

## Architecture

Prodigee follows a containerized microservice architecture deployed on **GCP Cloud Run**. AI, translation, speech, and vision capabilities are externalized to GCP APIs — no self-hosted inference.

```
                    ┌─────────────────────────┐
                    │       Clients           │
                    │  Web (Next.js 14)       │
                    │  Android (React Native) │
                    │  Desktop (Electron)     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    API Gateway (:8080)   │
                    │  Routing, rate limiting  │
                    └───┬────┬────┬────┬──────┘
                        │    │    │    │
          ┌─────────────┘    │    │    └──────────────┐
          │                  │    │                    │
   ┌──────▼──────┐  ┌───────▼──┐ ┌▼───────────┐  ┌───▼────┐
   │ Auth (:8081)│  │ Learning │ │ Analytics  │  │ AR/VR  │
   │ JWT, COPPA  │  │ Engine   │ │ Progress   │  │(:8084) │
   │ Sessions    │  │ (:8082)  │ │ (:8083)    │  │ Parked │
   └─────────────┘  └──────────┘ └────────────┘  └────────┘
                         │
              ┌──────────┴──────────┐
              │    GCP APIs         │
              │  Vertex AI          │
              │  Speech-to-Text     │
              │  Cloud Translation  │
              │  Cloud Vision       │
              └─────────────────────┘

   Data: Firestore (nam5 multi-region US)
   Images: Artifact Registry (us-east1)
   Secrets: Secret Manager
   Storage: Cloud Storage
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical specification.

---

## Repository Structure

```
prodigee/
├── services/                    # Microservices
│   ├── gateway/                 #   API Gateway — routing & rate limiting
│   ├── auth/                    #   Authentication — JWT, COPPA, sessions
│   ├── learning-engine/         #   Curriculum delivery, Vertex AI, Speech
│   ├── analytics/               #   Progress tracking, dashboards, reporting
│   └── ar-vr/                   #   AR/VR services (post-launch)
│
├── clients/                     # Frontend applications
│   └── web/                     #   Next.js 14 + TypeScript + Tailwind CSS
│       └── src/app/             #     Pages: dashboard, activity, progress, auth
│
├── tests/                       # Integration tests
│   └── test_integration.py      #   8-phase E2E flow against docker-compose stack
│
├── shared/                      # Shared libraries
│   ├── models/                  #   Firestore document schemas (Pydantic)
│   ├── utils/                   #   Common utilities
│   └── config/                  #   Shared configuration
│
├── infra/                       # Infrastructure & deployment
│   ├── setup-secrets.sh         #   GCP Secret Manager setup
│   ├── setup-domain.sh          #   Cloud Run domain mapping
│   └── terraform/               #   GCP resource definitions (planned)
│
├── eg-curriculum/               # Curriculum data (JSON) — reusable as-is
├── eg-backend-code/             # [Legacy] Flask monolith — reference only
├── eg-android-app/              # [Legacy] React Native mobile app
├── eg-frontend-win-mac/         # [Legacy] Electron desktop app
├── eg-vr-classroom/             # [Legacy] VR classroom services
├── library-backend-data/        # [Legacy] FastAPI content server
├── library-indexer/             # [Legacy] Content indexing tool
├── eg-institute/                # [Legacy] Admin portal stub
├── _archive/                    # Archived previous implementations
│
├── ARCHITECTURE.md              # Master technical architecture spec
├── DEVELOPMENT.md               # Local development setup guide
├── docker-compose.yml           # Local dev orchestration
└── cloudbuild.yaml              # GCP Cloud Build CI/CD pipeline
```

### Legacy vs. New

Folders prefixed with `eg-` and `library-` contain legacy code from the original build. This code is being decomposed and rewritten into the `services/` microservices. The legacy folders remain for reference during the rewrite.

**Do not build new features in the legacy folders.**

---

## Core Services

| Service | Port | Purpose | Key GCP APIs |
|---------|------|---------|-------------|
| **gateway** | 8080 | Request routing, rate limiting, auth validation | — |
| **auth** | 8081 | Parent/child auth, COPPA compliance, JWT sessions | Identity Platform, Firestore |
| **learning-engine** | 8082 | Curriculum delivery, adaptive learning, voice | Vertex AI, Speech-to-Text, Translation, Storage |
| **analytics** | 8083 | Progress tracking, dashboards, teacher reporting | Firestore |
| **ar-vr** | 8084 | AR/VR interactive experiences (parked) | Vision |

---

## Curriculum

The platform delivers three integrated curricula:

- **Heggerty Phonemic Awareness** — 35-week systematic progression across 8 skills (rhyming through phoneme substitution), 8-minute daily lessons with multi-sensory hand motions
- **STEM Integration** — Hands-on projects organized by age group (3-5, 6-8, 9-10)
- **Character Development** — 12 core traits with biblical foundations and American values

Curriculum data lives in `eg-curriculum/` as JSON and is consumed by the learning engine service.

---

## Quick Start

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.

```bash
# Clone
git clone git@github.com:ProfessorMoose74/prodigee.git
cd prodigee

# Run all services locally
docker compose up --build

# Services available at:
#   Gateway:         http://localhost:8080
#   Auth:            http://localhost:8081
#   Learning Engine: http://localhost:8082
#   Analytics:       http://localhost:8083
#   AR/VR:           http://localhost:8084
#   Firestore UI:    http://localhost:8086
```

---

## GCP Project

| Property | Value |
|----------|-------|
| Project ID | `prodigee-488119` |
| Project Number | `446166630230` |
| Region | `us-east1` |
| Firestore | `nam5` (multi-region US) |
| Artifact Registry | `us-east1-docker.pkg.dev/prodigee-488119/prodigee/` |

---

## Tech Stack

- **Backend:** Python 3.12 + FastAPI + Uvicorn
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Data:** Google Cloud Firestore
- **AI:** Vertex AI (adaptive learning, content generation)
- **Speech:** Cloud Speech-to-Text (pronunciation assessment)
- **Translation:** Cloud Translation API (30+ languages)
- **Auth:** JWT with COPPA-compliant child sessions
- **Secrets:** GCP Secret Manager
- **Containers:** Docker → Cloud Run
- **CI/CD:** Cloud Build → Artifact Registry → Cloud Run
- **Testing:** pytest + pytest-asyncio (unit) + httpx E2E integration

---

## Related Projects

| Project | Status | Platform |
|---------|--------|----------|
| **TruckerFlow** | Final stages | GCP |
| **CreatorFlow** | Pending MS Store cert | Windows |
| **ServiceFlow** | Live | Google Play |
| **TidyFlow** | Active | Desktop |
