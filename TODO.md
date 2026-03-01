# Prodigee — TODO List

**Last updated:** March 1, 2026
**Context:** All 5 microservices deployed to Cloud Run. Firebase Hosting live at `https://prodigee-488119.web.app` — serves static Next.js frontend and proxies `/api/**` to Cloud Run gateway. Service-to-service auth via metadata server ID tokens. CI/CD pipeline (12 steps) deploys everything on push to main. Next priorities: custom domain setup, GCP API integration testing, and auth enhancements. See `CLAUDE.md` for architecture context.

---

## Priority 1 — Testing & Integration

### 1.1 Write unit tests for all services
- [x] Auth service tests (`services/auth/tests/`)
  - Parent registration (valid, duplicate email, weak password)
  - Parent login (valid, wrong password, nonexistent)
  - Child login (valid, wrong parent, child not found)
  - Token validation and blacklisting
  - COPPA session limits by age range
- [x] Learning engine tests (`services/learning-engine/tests/`)
  - Curriculum data loading (all 35 weeks, 3 age groups)
  - Progress calculation and mastery level transitions
  - Activity completion (Firestore writes, star/streak updates, week advancement)
  - Voice processing with simulated fallback
  - AI recommendation (rule-based fallback)
- [x] Analytics service tests (`services/analytics/tests/`)
  - Aggregation functions (compute_overall_progress, compute_session_stats, etc.)
  - Parent dashboard with multiple children
  - Child access verification (own data vs parent access)
  - Pagination on sessions endpoint
- [x] Gateway tests (`services/gateway/tests/`)
  - Proxy routing to all 4 backend services
  - Unknown service returns 404
  - Backend timeout returns 504
  - Backend unreachable returns 502
  - X-Request-ID injection

### 1.2 Integration testing with Firestore emulator
- [x] Stand up full stack with `docker compose up` including firestore-emulator
- [x] End-to-end flow: register parent → add child → child login → complete activity → view progress in analytics
- [x] Verify token blacklisting works across services (logout in auth → rejected in learning engine)

---

## Priority 2 — Production Readiness

### 2.1 Secret management
- [x] Create `jwt-secret` setup script (`infra/setup-secrets.sh`) — auto-generates secret, grants Cloud Build + Cloud Run access
- [x] Update Cloud Run service configs to mount secret as env var (cloudbuild.yaml `--set-secrets`)
- [x] All services that decode JWTs reference the same `jwt-secret:latest` from Secret Manager
- [x] Run Secret Manager setup — jwt-secret created (version 1), Cloud Build + Compute SA granted secretAccessor

### 2.2 Docker group fix
- [ ] Add `moose` user to `docker` group (`sudo usermod -aG docker moose`) so `sg docker -c` workaround is no longer needed

### 2.3 Environment configuration
- [x] Create `.env.example` with all required environment variables per service
- [x] Document production vs development config differences (auto-CORS, .env.example comments, setup scripts)
- [ ] Set up staging environment in GCP

### 2.4 Logging & observability
- [ ] Integrate `google-cloud-logging` (already in gateway requirements) across all services
- [x] Structured JSON logging for Cloud Run
- [x] Request tracing — propagate gateway's `X-Request-ID` through backend services
- [ ] Error alerting (Cloud Monitoring)

### 2.5 CORS configuration for production
- [x] Update `cors_origins` in all services — auto-switches to production domains when `ENVIRONMENT=production`
- [x] Domain mapping script (`infra/setup-domain.sh`) — maps getprodigee.com/.net to gateway Cloud Run service
- [ ] Configure custom domains (getprodigee.com, getprodigee.net) on Firebase Hosting + DNS records at registrar
- [ ] Verify SSL certificate provisioning after DNS propagation

---

## Priority 3 — Feature Completion

### 3.1 Frontend client
- [x] Decide on framework — Next.js 14 (App Router) + TypeScript + Tailwind CSS for web
- [x] Scaffold client app in `clients/web/` directory
- [x] Parent registration/login flow (`/login`, `/register`)
- [x] Child login — parent-proxy COPPA flow (`/child-login`)
- [x] Learning dashboard with curriculum navigation (`/child-dashboard`)
- [x] Activity view with voice interaction (`/activity?skill=...`)
- [x] Parent analytics dashboard (`/dashboard`)
- [x] Progress reports and skill breakdowns (`/progress?child=...`)

### 3.2 Cloud Run deployment
- [x] First deployment of all services to Cloud Run
- [x] Verify `cloudbuild.yaml` pipeline — env vars, secrets, resource limits, Firestore rules deploy
- [x] Set up Firestore security rules for production
- [x] Configure Cloud Run IAM (gateway `--allow-unauthenticated`, backends `--no-allow-unauthenticated`)
- [x] Service-to-service auth — gateway fetches ID tokens from metadata server, forwards user JWTs via X-Forwarded-Authorization
- [x] Firebase Hosting — serves static Next.js SPA, proxies `/api/**` to Cloud Run gateway
- [x] `--no-invoker-iam-check` on gateway for Firebase Hosting rewrites (org policy blocks allUsers)
- [x] End-to-end verified: registration, login, health checks all work through `prodigee-488119.web.app`
- [ ] Set up Artifact Registry cleanup policy

### 3.3 GCP API integration testing
- [ ] Test Speech-to-Text with real audio in Cloud Run
- [ ] Test Text-to-Speech voice synthesis
- [ ] Test Vertex AI (Gemini) recommendations with real curriculum data
- [ ] Verify graceful fallback still works when APIs hit quota limits

---

## Priority 4 — Enhancements

### 4.1 Auth enhancements
- [ ] Password reset flow (email-based)
- [ ] Email verification on parent registration
- [ ] Refresh token rotation
- [ ] Rate limiting on login endpoints (currently defined but not per-route in auth)

### 4.2 Learning engine enhancements
- [ ] Assessment collection writes (currently assessments are derived from sessions in analytics)
- [ ] Multi-language support via Cloud Translation API
- [ ] Content caching (curriculum data is static, loaded from JSON at startup)
- [ ] Streak reset logic (currently only increments, never resets on missed days)

### 4.3 Analytics enhancements
- [ ] Time-series progress charts (skill accuracy over time)
- [ ] Export reports as PDF
- [ ] Teacher/classroom reporting (currently placeholder)
- [ ] Comparison analytics (child vs. age-group averages)

### 4.4 Gateway enhancements
- [ ] Per-route rate limiting (stricter for auth endpoints)
- [ ] Request/response logging middleware
- [ ] WebSocket proxying (for future real-time features)
- [ ] API versioning (`/api/v1/...`)

---

## Priority 5 — Post-Launch

### 5.1 AR/VR service
- [ ] Define MVP AR experience scope
- [ ] Implement AR/VR service endpoints
- [ ] Unity WebGL or native integration
- [ ] Reference: `eg-vr-classroom/` has 21 Unity C# scripts (~8,600 lines)

### 5.2 Admin/Institute portal
- [ ] Teacher dashboard
- [ ] School admin management
- [ ] Bulk student import
- [ ] Reference: `eg-institute/` has legacy admin portal stub

### 5.3 Subscription & billing
- [ ] Stripe integration for parent subscriptions
- [ ] Free/Standard/Premium/Institute tier enforcement
- [ ] Usage-based billing for API-heavy features (voice, AI)

---

## Completed

- [x] Server setup (ollam1 — Ubuntu 24.04, Docker, Python 3.12, gcloud SDK)
- [x] GCP project setup (prodigee-488119, us-east1, Firestore nam5, 18 APIs enabled)
- [x] Repository scaffolding (5 services + shared + infra + clients)
- [x] Documentation (README.md, ARCHITECTURE.md, DEVELOPMENT.md, per-service READMEs)
- [x] CI/CD pipeline (cloudbuild.yaml)
- [x] Auth service — 7 endpoints, JWT, bcrypt, COPPA compliance
- [x] Learning engine — 10 endpoints, Heggerty curriculum, voice, AI recommendations
- [x] Analytics service — 8 endpoints, progress aggregation, parent dashboard
- [x] Gateway service — reverse proxy, rate limiting, aggregated health
- [x] All services Docker-built and smoke-tested
- [x] All code pushed to GitHub (main branch)
- [x] CLAUDE.md created for Claude Code session context
- [x] Unit tests for all 4 services — 16 test files, 100+ test cases covering pure functions and route handlers
- [x] `.env.example` — comprehensive environment variable reference for all services
- [x] Structured JSON logging — Cloud Logging-compatible in production, human-readable in dev
- [x] X-Request-ID propagation — gateway injects, all backends extract/log/return in headers
- [x] E2E integration test (`tests/test_integration.py`) — 8-phase flow covering full stack with Firestore emulator
- [x] Firestore security rules (`firestore.rules`) — service-account-only writes, parent/child read scoping
- [x] `firebase.json` for deploying Firestore rules
- [x] Enhanced `cloudbuild.yaml` — production env vars, Secret Manager JWT, resource limits, IAM, Firestore rules deploy
- [x] Next.js 14 web client (`clients/web/`) — TypeScript, Tailwind CSS, App Router
- [x] API client library (`src/lib/api.ts`) — typed wrappers for auth, learning, analytics endpoints
- [x] Auth context (`src/lib/auth-context.tsx`) — parent/child token management with localStorage persistence
- [x] Parent flows — registration, login, dashboard with children overview and add-child form
- [x] Child flows — COPPA parent-proxy login, learning dashboard with skills grid, practice simulation
- [x] Activity page (`/activity`) — intro/practice/voice/result phases, voice recording with MediaRecorder, TTS playback
- [x] Progress reports (`/progress`) — 4-tab layout: overview stats, per-skill breakdowns, session history with pagination, weekly summaries
- [x] Navigation wiring — dashboard links to progress reports, child dashboard links to activity pages
- [x] Secret Manager setup script (`infra/setup-secrets.sh`) — creates jwt-secret, grants IAM to Cloud Build + Compute SA
- [x] Domain mapping script (`infra/setup-domain.sh`) — maps getprodigee.com/.net to Cloud Run gateway
- [x] Production CORS — all 4 services auto-switch origins to getprodigee.com/.net when ENVIRONMENT=production
- [x] GCP Secret Manager — jwt-secret created (v1), Cloud Build + Compute SA granted secretAccessor
- [x] Cloud Run deployment — all 5 services deployed (gateway, auth, learning-engine, analytics, ar-vr)
- [x] Service-to-service auth — gateway injects ID tokens from metadata server, forwards user JWTs via `X-Forwarded-Authorization`
- [x] Firebase Hosting — static Next.js SPA at `prodigee-488119.web.app`, `/api/**` rewrites to Cloud Run gateway
- [x] `--no-invoker-iam-check` on gateway — Firebase Hosting rewrites bypass Cloud Run IAM (org policy blocks allUsers)
- [x] `.firebaserc` — project alias for Firebase CLI
- [x] `firebase.json` — Hosting config with Cloud Run rewrites, SPA catch-all, caching headers
- [x] Next.js static export — `output: 'export'`, `trailingSlash: true`, Suspense boundaries for useSearchParams
- [x] Cloud Build CI/CD — 12-step pipeline: build 5 images → push → deploy 5 services → build/deploy web client to Firebase Hosting
- [x] End-to-end public access verified — registration, login, health checks through Firebase Hosting
